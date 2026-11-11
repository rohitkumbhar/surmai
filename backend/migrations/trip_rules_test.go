package migrations_test

import (
	"fmt"
	"net/http"
	"net/url"
	"testing"
)

// filter returns a URL encoded PocketBase filter matching field to value.
func filter(field, value string) string {
	return url.QueryEscape(fmt.Sprintf("%s=%q", field, value))
}

func TestTripAccessRules(t *testing.T) {
	readers := []actor{owner, collaborator, traveller, superuser}
	editors := []actor{owner, collaborator, superuser}

	expectation{
		allowed:       readers,
		allowedStatus: 200,
		allowedBody:   []string{`"totalItems":1`, tripId},
		deniedStatus:  listFiltered,
		deniedBody:    []string{`"totalItems":0`},
	}.run(t, request{name: "list trips", method: http.MethodGet, url: "/api/collections/trips/records?filter=" + filter("id", tripId)})

	expectation{
		allowed:       readers,
		allowedStatus: 200,
		allowedBody:   []string{tripId},
		deniedStatus:  notFound,
	}.run(t, request{name: "view trip", method: http.MethodGet, url: "/api/collections/trips/records/" + tripId})

	expectation{
		allowed:       editors,
		allowedStatus: 200,
		allowedBody:   []string{`"name":"Renamed"`},
		deniedStatus:  notFound,
	}.run(t, request{
		name: "update trip", method: http.MethodPatch,
		url: "/api/collections/trips/records/" + tripId, body: `{"name":"Renamed"}`,
	})

	expectation{
		allowed:       editors,
		allowedStatus: 204,
		deniedStatus:  notFound,
	}.run(t, request{name: "delete trip", method: http.MethodDelete, url: "/api/collections/trips/records/" + tripId})
}

func TestTripCanUpdateAttribute(t *testing.T) {
	url := "/api/collections/trips/records/" + tripId
	for who, canUpdate := range map[actor]bool{owner: true, collaborator: true, traveller: false} {
		s := scenario(request{name: "canUpdate", method: http.MethodGet, url: url}, who, 200,
			[]string{fmt.Sprintf(`"canUpdate":%v`, canUpdate)})
		s.Test(t)
	}
}

func TestTripChildAccessRules(t *testing.T) {
	readers := []actor{owner, collaborator, traveller, superuser}
	editors := []actor{owner, collaborator, superuser}

	for _, child := range tripChildren {
		t.Run(child.collection, func(t *testing.T) {
			base := "/api/collections/" + child.collection + "/records"

			expectation{
				allowed:       readers,
				allowedStatus: 200,
				allowedBody:   []string{`"totalItems":1`, child.recordId},
				deniedStatus:  listFiltered,
				deniedBody:    []string{`"totalItems":0`},
			}.run(t, request{name: "list", method: http.MethodGet, url: base + "?filter=" + filter("trip", tripId)})

			expectation{
				allowed:       readers,
				allowedStatus: 200,
				allowedBody:   []string{child.recordId},
				deniedStatus:  notFound,
			}.run(t, request{name: "view", method: http.MethodGet, url: base + "/" + child.recordId})

			data := child.data()
			data["trip"] = tripId
			expectation{
				allowed:       editors,
				allowedStatus: 200,
				allowedBody:   []string{tripId},
				deniedStatus:  createDenied,
			}.run(t, request{name: "create", method: http.MethodPost, url: base, body: toJSON(t, data)})

			expectation{
				allowed:       editors,
				allowedStatus: 200,
				allowedBody:   []string{child.recordId},
				deniedStatus:  notFound,
			}.run(t, request{name: "update", method: http.MethodPatch, url: base + "/" + child.recordId, body: child.update})

			expectation{
				allowed:       editors,
				allowedStatus: 204,
				deniedStatus:  notFound,
			}.run(t, request{name: "delete", method: http.MethodDelete, url: base + "/" + child.recordId})
		})
	}
}


func newTripBody(ownerId string) string {
	return fmt.Sprintf(`{"name":"New trip","startDate":"2026-07-01 00:00:00.000Z","endDate":"2026-07-05 00:00:00.000Z","ownerId":%q}`, ownerId)
}

func TestCreateOwnTrip(t *testing.T) {
	for who, id := range map[actor]string{owner: ownerId, stranger: strangerId} {
		s := scenario(request{
			name: "create own trip", method: http.MethodPost,
			url: "/api/collections/trips/records", body: newTripBody(id),
		}, who, 200, []string{`"ownerId":"` + id + `"`, `"canUpdate":true`})
		s.Test(t)
	}
}

func TestCreateTripForAnotherUser(t *testing.T) {

	for _, who := range []actor{anonymous, stranger} {
		s := scenario(request{
			name: "create trip owned by someone else", method: http.MethodPost,
			url: "/api/collections/trips/records", body: newTripBody(ownerId),
		}, who, 400, nil)
		s.Test(t)
	}
}

func TestMoveRecordIntoAnotherUsersTrip(t *testing.T) {

	s := scenario(request{
		name: "move own activity into someone else's trip", method: http.MethodPatch,
		url:  "/api/collections/activities/records/" + strangerActivityId,
		body: fmt.Sprintf(`{"trip":%q}`, tripId),
	}, stranger, 404, nil)
	s.Test(t)
}

func TestCollaboratorCannotTakeOwnership(t *testing.T) {

	s := scenario(request{
		name: "take ownership of a trip", method: http.MethodPatch,
		url:  "/api/collections/trips/records/" + tripId,
		body: fmt.Sprintf(`{"ownerId":%q}`, collaboratorId),
	}, collaborator, 404, nil)
	s.Test(t)
}

// Regression tests for the anonymous access hole fixed in
// 1794428024_require_authentication_in_api_rules.go. The trip, activity and
// traveller profile used here have no collaborators and no managers, which is
// what made the "?= @request.auth.id" rules match unauthenticated requests.
func TestAnonymousCannotReachUnsharedRecords(t *testing.T) {
	cases := []struct {
		name string
		url  string
	}{
		{"a trip without collaborators", records("trips") + "/" + strangerTripId},
		{"an activity in that trip", records("activities") + "/" + strangerActivityId},
		{"a traveller profile without managers", records("traveller_profiles") + "/" + kidProfileId},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			testScenario(t, request{name: "read", method: http.MethodGet, url: c.url}, anonymous, 404, nil)
			testScenario(t, request{
				name: "change", method: http.MethodPatch, url: c.url, body: `{"name":"changed"}`,
			}, anonymous, 404, nil)
			testScenario(t, request{name: "delete", method: http.MethodDelete, url: c.url}, anonymous, 404, nil)
		})
	}
}

func TestAnonymousCannotListRecords(t *testing.T) {
	for _, collection := range []string{"trips", "traveller_profiles", "activities", "trip_expenses"} {
		t.Run(collection, func(t *testing.T) {
			testScenario(t, request{name: "list", method: http.MethodGet, url: records(collection)},
				anonymous, 200, []string{`"totalItems":0`})
		})
	}
}
