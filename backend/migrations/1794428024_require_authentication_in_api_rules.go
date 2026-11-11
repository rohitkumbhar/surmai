package migrations

import (
	"fmt"
	"strings"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// Anonymous requests carry an empty @request.auth.id. A rule such as
// "collaborators.id ?= @request.auth.id" matched those requests whenever the
// relation was empty, because the comparison reduced to "" = "". Unauthenticated
// callers could therefore read, change and delete any trip without collaborators
// along with its transportations, lodgings, activities, expenses and attachments,
// and any traveller profile without managers.
//
// Every rule below now starts with an explicit signed-in check. The same migration
// closes three smaller gaps for authenticated users, who could otherwise
// create a trip owned by somebody else, move their own records into another
// user's trip, or take over a trip they were only a collaborator on.
const (
	signedIn = `@request.auth.id != ""`

	// A trip is readable by its owner, its collaborators and the users whose
	// traveller profile is attached to it. Only the first two may change it.
	tripReadable = `(ownerId = @request.auth.id || collaborators.id ?= @request.auth.id || travellers.email ?= @request.auth.email)`
	tripWritable = `(ownerId = @request.auth.id || collaborators.id ?= @request.auth.id)`

	// The same, for the collections holding a trip's contents.
	tripContentReadable = `(trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email)`
	tripContentWritable = `(trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id)`

	// Update rules are evaluated against the stored record, so without these a
	// relation could be repointed at a trip or user the caller has no access to.
	keepsSameTrip  = `(@request.body.trip:isset = false || @request.body.trip = trip)`
	keepsSameOwner = `(@request.body.ownerId:isset = false || @request.body.ownerId = ownerId)`

	// A traveller profile is readable by its owner, its managers and the user
	// whose email it carries. Only the owner may delete it.
	profileReadable = `(ownerId = @request.auth.id || managers.id ?= @request.auth.id || email = @request.auth.email)`
	profileWritable = `(ownerId = @request.auth.id || managers.id ?= @request.auth.id)`
)

// tripContentCollections hold the records belonging to a trip, all of which have
// a "trip" relation and follow the trip's own access rules.
var tripContentCollections = []string{
	"transportations",
	"lodgings",
	"activities",
	"trip_expenses",
	"trip_attachments",
}

type collectionRules struct {
	name                                      string
	list, view, create, update, deleteRecords *string
}

func init() {
	m.Register(func(app core.App) error {
		return applyCollectionRules(app, authenticatedRules())
	}, func(app core.App) error {
		return applyCollectionRules(app, rulesBeforeAuthenticationCheck())
	})
}

// rule joins the given conditions, requiring an authenticated caller first.
func rule(conditions ...string) *string {
	return types.Pointer(strings.Join(append([]string{signedIn}, conditions...), " && "))
}

func applyCollectionRules(app core.App, all []collectionRules) error {
	for _, rules := range all {
		collection, err := app.FindCollectionByNameOrId(rules.name)
		if err != nil {
			return fmt.Errorf("collection %q not found: %w", rules.name, err)
		}

		collection.ListRule = rules.list
		collection.ViewRule = rules.view
		collection.CreateRule = rules.create
		collection.UpdateRule = rules.update
		collection.DeleteRule = rules.deleteRecords

		if err := app.Save(collection); err != nil {
			return fmt.Errorf("failed to update the %q rules: %w", rules.name, err)
		}
	}

	return nil
}

func authenticatedRules() []collectionRules {
	all := []collectionRules{
		{
			name:   "trips",
			list:   rule(tripReadable),
			view:   rule(tripReadable),
			create: rule(`ownerId = @request.auth.id`),
			update: rule(tripWritable, keepsSameOwner),
			// a collaborator may still leave a trip by deleting it, as before
			deleteRecords: rule(tripWritable),
		},
		{
			name:          "traveller_profiles",
			list:          rule(profileReadable),
			view:          rule(profileReadable),
			create:        rule(),
			update:        rule(profileWritable),
			deleteRecords: rule(`ownerId = @request.auth.id`),
		},
		{
			name:   "invitations",
			list:   rule(`recipientEmail = @request.auth.email:lower`),
			view:   rule(`recipientEmail = @request.auth.email:lower`),
			create: rule(),
			update: rule(`recipientEmail = @request.auth.email:lower`),
			// deleted by the cleanup job, which does not go through the API rules
			deleteRecords: nil,
		},
		{
			name:          "notifications",
			list:          rule(`userId = @request.auth.id`),
			view:          rule(`userId = @request.auth.id`),
			create:        rule(`userId = @request.auth.id`),
			update:        rule(`userId = @request.auth.id`),
			deleteRecords: rule(`userId = @request.auth.id`),
		},
	}

	for _, name := range tripContentCollections {
		all = append(all, collectionRules{
			name:          name,
			list:          rule(tripContentReadable),
			view:          rule(tripContentReadable),
			create:        rule(tripContentWritable),
			update:        rule(tripContentWritable, keepsSameTrip),
			deleteRecords: rule(tripContentWritable),
		})
	}

	return all
}

// rulesBeforeAuthenticationCheck returns the rules as they were before this
// migration, so that it can be rolled back.
func rulesBeforeAuthenticationCheck() []collectionRules {
	const (
		oldTripReadable        = `ownerId = @request.auth.id || collaborators.id ?= @request.auth.id || travellers.email ?= @request.auth.email`
		oldTripWritable        = `ownerId = @request.auth.id || collaborators.id ?= @request.auth.id`
		oldTripContentReadable = `trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email`
		oldTripContentWritable = `trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id`
		oldProfileReadable     = `ownerId = @request.auth.id || managers.id ?= @request.auth.id || email = @request.auth.email`
		oldProfileWritable     = `ownerId = @request.auth.id || managers.id ?= @request.auth.id`
		oldRecipient           = `recipientEmail = @request.auth.email:lower`
		oldOwnNotification     = `userId = @request.auth.id`
	)

	all := []collectionRules{
		{
			name:          "trips",
			list:          types.Pointer(oldTripReadable),
			view:          types.Pointer(oldTripReadable),
			create:        types.Pointer(""),
			update:        types.Pointer(oldTripWritable),
			deleteRecords: types.Pointer(oldTripWritable),
		},
		{
			name:          "traveller_profiles",
			list:          types.Pointer(oldProfileReadable),
			view:          types.Pointer(oldProfileReadable),
			create:        types.Pointer(signedIn),
			update:        types.Pointer(oldProfileWritable),
			deleteRecords: types.Pointer(`ownerId = @request.auth.id`),
		},
		{
			name:          "invitations",
			list:          types.Pointer(oldRecipient),
			view:          types.Pointer(oldRecipient),
			create:        types.Pointer(""),
			update:        types.Pointer(oldRecipient),
			deleteRecords: nil,
		},
		{
			name:          "notifications",
			list:          types.Pointer(oldOwnNotification),
			view:          types.Pointer(oldOwnNotification),
			create:        types.Pointer(oldOwnNotification),
			update:        types.Pointer(oldOwnNotification),
			deleteRecords: types.Pointer(oldOwnNotification),
		},
	}

	for _, name := range tripContentCollections {
		all = append(all, collectionRules{
			name:          name,
			list:          types.Pointer(oldTripContentReadable),
			view:          types.Pointer(oldTripContentReadable),
			create:        types.Pointer(oldTripContentWritable),
			update:        types.Pointer(oldTripContentWritable),
			deleteRecords: types.Pointer(oldTripContentWritable),
		})
	}

	return all
}
