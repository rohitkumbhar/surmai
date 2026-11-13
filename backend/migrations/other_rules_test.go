package migrations_test

import (
	"fmt"
	"net/http"
	"testing"
)

func records(collection string) string {
	return "/api/collections/" + collection + "/records"
}

func TestTravellerProfileAccessRules(t *testing.T) {
	// When the traveller signed up, they became the owner of the profile the
	// owner had created for them, and the owner became a manager.
	readers := []actor{owner, traveller, superuser}
	base := records("traveller_profiles")

	expectation{
		allowed:       readers,
		allowedStatus: 200,
		allowedBody:   []string{`"totalItems":1`},
		deniedStatus:  listFiltered,
		deniedBody:    []string{`"totalItems":0`},
	}.run(t, request{name: "list", method: http.MethodGet, url: base + "?filter=" + filter("id", profileId)})

	expectation{
		allowed:       readers,
		allowedStatus: 200,
		allowedBody:   []string{profileId, `"managers":[{`},
		deniedStatus:  notFound,
	}.run(t, request{name: "view", method: http.MethodGet, url: base + "/" + profileId})

	expectation{
		allowed:       readers,
		allowedStatus: 200,
		allowedBody:   []string{`"legalName":"Renamed"`},
		deniedStatus:  notFound,
	}.run(t, request{name: "update", method: http.MethodPatch, url: base + "/" + profileId, body: `{"legalName":"Renamed"}`})

	// managers can edit but not delete
	expectation{
		allowed:       []actor{traveller, superuser},
		allowedStatus: 204,
		deniedStatus:  notFound,
	}.run(t, request{name: "delete", method: http.MethodDelete, url: base + "/" + profileId})

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{kidProfileId},
		deniedStatus:  notFound,
	}.run(t, request{name: "view profile without a user", method: http.MethodGet, url: base + "/" + kidProfileId})

	expectation{
		allowed:       []actor{owner, collaborator, traveller, stranger, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"legalName":"New Person"`},
		deniedStatus:  map[actor]int{anonymous: 400},
	}.run(t, request{
		name: "create", method: http.MethodPost, url: base,
		body: fmt.Sprintf(`{"email":"new@example.com","legalName":"New Person","ownerId":%q}`, strangerId),
	})
}

func TestOnlyProfileOwnerCanChangeManagers(t *testing.T) {
	url := records("traveller_profiles") + "/" + profileId

	// the owner is a manager of the traveller's profile
	testScenario(t, request{name: "manager removes managers", method: http.MethodPatch, url: url, body: `{"managers":[]}`},
		owner, 400, nil)
	testScenario(t, request{
		name: "manager adds a manager", method: http.MethodPatch, url: url,
		body: `{"addManagerEmails":["collaborator@example.com"]}`,
	}, owner, 400, nil)

	testScenario(t, request{
		name: "profile owner adds a manager", method: http.MethodPatch, url: url,
		body: `{"addManagerEmails":["collaborator@example.com"]}`,
	}, traveller, 200, []string{`"managers":["` + ownerId + `","` + collaboratorId + `"]`})

	testScenario(t, request{
		name: "profile owner adds an unknown manager", method: http.MethodPatch, url: url,
		body: `{"addManagerEmails":["nobody@example.com"]}`,
	}, traveller, 400, nil)

	testScenario(t, request{name: "profile owner removes managers", method: http.MethodPatch, url: url, body: `{"managers":[]}`},
		traveller, 200, []string{`"managers":[]`})
}

func TestNotificationAccessRules(t *testing.T) {
	base := records("notifications")

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"totalItems":1`},
		deniedStatus:  listFiltered,
		deniedBody:    []string{`"totalItems":0`},
	}.run(t, request{name: "list", method: http.MethodGet, url: base + "?filter=" + filter("id", notificationId)})

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"read":true`},
		deniedStatus:  notFound,
	}.run(t, request{name: "mark as read", method: http.MethodPatch, url: base + "/" + notificationId, body: `{"read":true}`})

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"subject":"Note to self"`},
		deniedStatus:  createDenied,
	}.run(t, request{
		name: "create for the owner", method: http.MethodPost, url: base,
		body: fmt.Sprintf(`{"userId":%q,"subject":"Note to self"}`, ownerId),
	})
}

func TestUserAccessRules(t *testing.T) {
	base := records("users")

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{ownerId},
		deniedStatus:  notFound,
	}.run(t, request{name: "view", method: http.MethodGet, url: base + "/" + ownerId})

	expectation{
		allowed:       []actor{owner, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"name":"Renamed"`},
		deniedStatus:  notFound,
	}.run(t, request{name: "update", method: http.MethodPatch, url: base + "/" + ownerId, body: `{"name":"Renamed"}`})

	expectation{
		allowed:       []actor{superuser},
		allowedStatus: 200,
		allowedBody:   []string{ownerId, strangerId},
		deniedStatus:  superuserOnly,
	}.run(t, request{name: "list", method: http.MethodGet, url: base})
}

func TestSuperuserOnlyCollections(t *testing.T) {
	for _, collection := range []string{"surmai_settings", "account_invitations"} {
		t.Run(collection, func(t *testing.T) {
			expectation{
				allowed:       []actor{superuser},
				allowedStatus: 200,
				allowedBody:   []string{`"items":`},
				deniedStatus:  superuserOnly,
			}.run(t, request{name: "list", method: http.MethodGet, url: records(collection)})
		})
	}
}

func TestReferenceDataRules(t *testing.T) {
	for _, collection := range []string{"airports", "places", "airlines", "currency_conversions"} {
		t.Run(collection, func(t *testing.T) {
			expectation{
				allowed:       allActors,
				allowedStatus: 200,
				allowedBody:   []string{`"items":`},
			}.run(t, request{name: "list", method: http.MethodGet, url: records(collection)})

			expectation{
				allowed:       []actor{superuser},
				allowedStatus: 400, // allowed, but the empty body fails validation
				deniedStatus:  superuserOnly,
			}.run(t, request{name: "create", method: http.MethodPost, url: records(collection), body: `{}`})
		})
	}
}

func TestAnnouncementRules(t *testing.T) {
	signedIn := []actor{owner, collaborator, traveller, stranger, superuser}

	expectation{
		allowed:       signedIn,
		allowedStatus: 200,
		allowedBody:   []string{`"totalItems":1`, announcementId},
		deniedStatus:  map[actor]int{anonymous: 200},
		deniedBody:    []string{`"totalItems":0`},
	}.run(t, request{name: "list", method: http.MethodGet, url: records("announcements")})

	expectation{
		allowed:       []actor{superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"subject":"Maintenance"`},
		deniedStatus:  superuserOnly,
	}.run(t, request{name: "create", method: http.MethodPost, url: records("announcements"), body: `{"subject":"Maintenance"}`})
}

func TestInvitationAccessRules(t *testing.T) {
	base := records("invitations")

	// only the recipient sees an invitation, not the sender
	expectation{
		allowed:       []actor{stranger, superuser},
		allowedStatus: 200,
		allowedBody:   []string{`"totalItems":1`},
		deniedStatus:  listFiltered,
		deniedBody:    []string{`"totalItems":0`},
	}.run(t, request{name: "list", method: http.MethodGet, url: base + "?filter=" + filter("id", invitationId)})

	expectation{
		allowed:       []actor{stranger, superuser},
		allowedStatus: 200,
		allowedBody:   []string{invitationId},
		deniedStatus:  notFound,
	}.run(t, request{name: "view", method: http.MethodGet, url: base + "/" + invitationId})

	expectation{
		allowed:       []actor{superuser},
		allowedStatus: 204,
		deniedStatus:  superuserOnly,
	}.run(t, request{name: "delete", method: http.MethodDelete, url: base + "/" + invitationId})
}
