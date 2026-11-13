package migrations_test

// Helpers for testing the collection API rules defined by the migrations and
// access to the Surmai routes. Each scenario clones an app seeded with the same
// users and trips, and makes one request as one actor.

import (
	"backend/testutil"
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

type actor string

const (
	owner        actor = "owner"
	collaborator actor = "collaborator"
	traveller    actor = "traveller" // a user whose traveller profile is on the trip
	stranger     actor = "stranger"
	anonymous    actor = "anonymous"
	superuser    actor = "superuser"
)

var allActors = []actor{owner, collaborator, traveller, stranger, anonymous, superuser}

const (
	ownerId        = "owner0000000001"
	collaboratorId = "collab000000001"
	travellerId    = "travel000000001"
	strangerId     = "strang000000001"
	tripId         = "trip00000000001"
	profileId      = "profile00000001" // linked to the traveller user
	kidProfileId   = "profile00000002" // owned by the owner, no user account

	strangerTripId     = "strangertrip001"
	strangerActivityId = "strangeract0001"

	notificationId = "notif0000000001" // for the owner
	invitationId   = "invite000000001" // from the owner to the stranger
	announcementId = "announce0000001"
)

func TestMain(m *testing.M) { testutil.Main(m) }

var seeded = testutil.NewTemplate(seed)

// seed creates the users, a trip shared with a collaborator and a traveller,
// and one record in each trip child collection.
func seed(t testing.TB, app core.App) {
	t.Helper()

	createUser := func(id, email string) *core.Record {
		return testutil.CreateRecord(t, app, "users", map[string]any{
			"id":       id,
			"email":    email,
			"name":     email,
			"password": testutil.DefaultPassword,
		})
	}
	ownerUser := createUser(ownerId, "owner@example.com")
	createUser(collaboratorId, "collaborator@example.com")
	createUser(strangerId, "stranger@example.com")

	// The owner adds a traveller profile by email. When that person signs up,
	// they are linked to the profile and gain read access to the trip.
	testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"id":        profileId,
		"email":     "traveller@example.com",
		"legalName": "Trip Traveller",
		"ownerId":   ownerId,
	})
	createUser(travellerId, "traveller@example.com")

	testutil.CreateTrip(t, app, ownerUser, map[string]any{
		"id":            tripId,
		"collaborators": []string{collaboratorId},
		"travellers":    []string{profileId},
	})

	for _, child := range tripChildren {
		data := child.data()
		data["id"] = child.recordId
		data["trip"] = tripId
		testutil.CreateRecord(t, app, child.collection, data)
	}

	testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"id":        kidProfileId,
		"email":     "kid@example.com",
		"legalName": "Kid Traveller",
		"ownerId":   ownerId,
	})

	strangerUser, err := app.FindRecordById("users", strangerId)
	if err != nil {
		t.Fatal(err)
	}
	testutil.CreateTrip(t, app, strangerUser, map[string]any{"id": strangerTripId, "name": "Stranger's trip"})
	testutil.CreateRecord(t, app, "activities", map[string]any{
		"id":        strangerActivityId,
		"trip":      strangerTripId,
		"name":      "Stranger's activity",
		"address":   "Somewhere",
		"startDate": "2026-06-02 09:00:00.000Z",
	})

	testutil.CreateRecord(t, app, "notifications", map[string]any{
		"id":      notificationId,
		"userId":  ownerId,
		"subject": "Hello owner",
	})

	testutil.CreateRecord(t, app, "invitations", map[string]any{
		"id":             invitationId,
		"from":           ownerId,
		"recipientEmail": "stranger@example.com",
		"trip":           tripId,
		"status":         "open",
	})

	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"id":      announcementId,
		"subject": "Welcome",
	})
}

func authenticate(t testing.TB, app core.App, who actor, headers map[string]string) {
	t.Helper()

	var record *core.Record
	var err error
	switch who {
	case anonymous:
		return
	case superuser:
		record = testutil.Superuser(t, app)
	default:
		record, err = app.FindAuthRecordByEmail("users", string(who)+"@example.com")
		if err != nil {
			t.Fatal(err)
		}
	}
	headers["Authorization"] = testutil.AuthToken(t, record)
}

type request struct {
	name   string
	method string
	url    string
	body   string
}

// scenario returns an ApiScenario that seeds a fresh app and sends the request as the given actor.
func scenario(r request, who actor, status int, content []string) tests.ApiScenario {
	headers := map[string]string{}
	if r.body != "" {
		headers["Content-Type"] = "application/json"
	}

	s := tests.ApiScenario{
		Name:           fmt.Sprintf("%s as %s", r.name, who),
		Method:         r.method,
		URL:            r.url,
		Headers:        headers,
		ExpectedStatus: status,
		TestAppFactory: func(t testing.TB) *tests.TestApp {
			app := seeded.Factory()(t)
			// headers are read after the factory runs, so the token can be added here
			authenticate(t, app, who, headers)
			return app
		},
	}
	if r.body != "" {
		s.Body = strings.NewReader(r.body)
	}
	if len(content) > 0 {
		s.ExpectedContent = content
	} else {
		// ApiScenario requires one of these for a non-empty body
		s.NotExpectedContent = []string{"__not_in_any_response__"}
	}
	return s
}

func testScenario(t *testing.T, r request, who actor, status int, content []string) {
	t.Helper()
	s := scenario(r, who, status, content)
	s.Test(t)
}

// expectation maps actors to the expected status of a request. Actors that
// are missing get the denied status.
type expectation struct {
	allowed       []actor
	allowedStatus int
	allowedBody   []string
	deniedStatus  map[actor]int
	deniedBody    []string
}

func (e expectation) run(t *testing.T, r request) {
	t.Helper()

	for _, who := range allActors {
		status, body := e.deniedStatus[who], e.deniedBody
		for _, a := range e.allowed {
			if a == who {
				status, body = e.allowedStatus, e.allowedBody
			}
		}
		if status == 0 {
			t.Fatalf("%s: no expected status for %s", r.name, who)
		}
		s := scenario(r, who, status, body)
		s.Test(t)
	}
}

// statuses PocketBase returns when an API rule denies access
var (
	// list requests are filtered rather than rejected
	listFiltered = map[actor]int{owner: 200, collaborator: 200, traveller: 200, stranger: 200, anonymous: 200}
	// view, update and delete of a record outside the rule look like it doesn't exist
	notFound = map[actor]int{owner: 404, collaborator: 404, traveller: 404, stranger: 404, anonymous: 404}
	// a failed create rule
	createDenied = map[actor]int{owner: 400, collaborator: 400, traveller: 400, stranger: 400, anonymous: 400}
	// rules that are nil, i.e. superuser only
	superuserOnly = map[actor]int{owner: 403, collaborator: 403, traveller: 403, stranger: 403, anonymous: 403}
)

type tripChild struct {
	collection string
	recordId   string
	data       func() map[string]any
	update     string
}

var tripChildren = []tripChild{
	{
		collection: "transportations",
		recordId:   "transport000001",
		data: func() map[string]any {
			return map[string]any{
				"type":          "flight",
				"origin":        "JFK",
				"destination":   "CDG",
				"departureTime": "2026-06-01 10:00:00.000Z",
				"arrivalTime":   "2026-06-01 22:00:00.000Z",
			}
		},
		update: `{"origin":"EWR"}`,
	},
	{
		collection: "lodgings",
		recordId:   "lodging00000001",
		data: func() map[string]any {
			return map[string]any{
				"type":      "hotel",
				"name":      "Hotel Paris",
				"address":   "1 Rue de Rivoli",
				"startDate": "2026-06-01 15:00:00.000Z",
				"endDate":   "2026-06-05 11:00:00.000Z",
			}
		},
		update: `{"name":"Hotel Lyon"}`,
	},
	{
		collection: "activities",
		recordId:   "activity0000001",
		data: func() map[string]any {
			return map[string]any{
				"name":      "Louvre",
				"address":   "Rue de Rivoli",
				"startDate": "2026-06-02 09:00:00.000Z",
			}
		},
		update: `{"name":"Orsay"}`,
	},
	{
		collection: "trip_expenses",
		recordId:   "expense00000001",
		data: func() map[string]any {
			return map[string]any{"name": "Dinner"}
		},
		update: `{"name":"Lunch"}`,
	},
	{
		collection: "trip_attachments",
		recordId:   "attach000000001",
		data: func() map[string]any {
			return map[string]any{"name": "ticket.pdf"}
		},
		update: `{"name":"boarding-pass.pdf"}`,
	},
}

func toJSON(t testing.TB, data map[string]any) string {
	t.Helper()

	b, err := json.Marshal(data)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}
