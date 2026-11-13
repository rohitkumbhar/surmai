package routes_test

import (
	"backend/testutil"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

type calendarResponse struct {
	Data                  string `json:"data"`
	AllTimezonesAvailable bool   `json:"allTimezonesAvailable"`
}

// calendarFor requests the trip's calendar and returns the decoded iCalendar text.
func calendarFor(t testing.TB, app *tests.TestApp, trip, user *core.Record) (string, calendarResponse) {
	t.Helper()

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/surmai/trip/"+trip.Id+"/calendar", "", user)
	if recorder.Code != http.StatusOK {
		t.Fatalf("calendar request returned %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	var payload calendarResponse
	if err := json.Unmarshal([]byte(testutil.Body(t, recorder)), &payload); err != nil {
		t.Fatal(err)
	}

	ics, err := base64.StdEncoding.DecodeString(payload.Data)
	if err != nil {
		t.Fatalf("response data is not base64: %v", err)
	}
	return string(ics), payload
}

// place returns the metadata shape the UI stores for a location.
func place(timezone string) map[string]any {
	return map[string]any{"place": map[string]any{"timezone": timezone}}
}

func TestCalendarIncludesTheTripAsAnAllDayEvent(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{
		"name":        "Paris in June",
		"description": "A week away",
		"startDate":   "2026-06-01 00:00:00.000Z",
		"endDate":     "2026-06-10 00:00:00.000Z",
	})

	ics, _ := calendarFor(t, app, trip, owner)

	for _, want := range []string{
		"BEGIN:VCALENDAR",
		"METHOD:PUBLISH",
		"UID:trip-" + trip.Id + "@surmai.app",
		"SUMMARY:Paris in June",
		"DESCRIPTION:A week away",
		"DTSTART;VALUE=DATE:20260601",
		"DTEND;VALUE=DATE:20260610",
		"TRANSP:TRANSPARENT", // an all-day trip must not show as busy
		"END:VCALENDAR",
	} {
		if !strings.Contains(ics, want) {
			t.Errorf("calendar is missing %q\n%s", want, ics)
		}
	}
}

func TestCalendarIncludesEachEntry(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	transportation := testutil.CreateRecord(t, app, "transportations", map[string]any{
		"type": "flight", "origin": "JFK", "destination": "CDG",
		"departureTime": "2026-06-01 10:00:00.000Z",
		"arrivalTime":   "2026-06-01 22:00:00.000Z",
		"trip":          trip.Id,
		"metadata": map[string]any{
			"origin":      map[string]any{"timezone": "America/New_York"},
			"destination": map[string]any{"timezone": "Europe/Paris"},
		},
	})
	lodging := testutil.CreateRecord(t, app, "lodgings", map[string]any{
		"type": "hotel", "name": "Hotel Paris", "address": "1 Rue de Rivoli",
		"startDate": "2026-06-01 15:00:00.000Z",
		"endDate":   "2026-06-05 11:00:00.000Z",
		"trip":      trip.Id,
		"metadata":  place("Europe/Paris"),
	})
	activity := testutil.CreateRecord(t, app, "activities", map[string]any{
		"name": "Louvre", "address": "Rue de Rivoli",
		"startDate": "2026-06-02 09:00:00.000Z",
		"endDate":   "2026-06-02 12:00:00.000Z",
		"trip":      trip.Id,
		"metadata":  place("Europe/Paris"),
	})

	ics, _ := calendarFor(t, app, trip, owner)

	for _, want := range []string{
		"UID:transport-" + transportation.Id + "@surmai.app",
		"UID:lodging-checkin-" + lodging.Id + "@surmai.app",
		"UID:lodging-checkout-" + lodging.Id + "@surmai.app",
		"UID:activity-" + activity.Id + "@surmai.app",
		"SUMMARY:Louvre",
		"LOCATION:Rue de Rivoli",
	} {
		if !strings.Contains(ics, want) {
			t.Errorf("calendar is missing %q\n%s", want, ics)
		}
	}
}

func TestCalendarGivesAnActivityWithoutAnEndDateAnHour(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)
	testutil.CreateRecord(t, app, "activities", map[string]any{
		"name": "Coffee", "address": "Somewhere",
		"startDate": "2026-06-02 09:00:00.000Z",
		"trip":      trip.Id,
	})

	ics, _ := calendarFor(t, app, trip, owner)

	if !strings.Contains(ics, "DTSTART:20260602T090000Z") {
		t.Errorf("calendar is missing the activity start\n%s", ics)
	}
	if !strings.Contains(ics, "DTEND:20260602T100000Z") {
		t.Errorf("an activity without an end date should last an hour\n%s", ics)
	}
}

func TestCalendarListsTravellersInTheDescription(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	profile := testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"email": "flyer@example.com", "legalName": "Frequent Flyer", "ownerId": owner.Id,
	})
	trip := testutil.CreateTrip(t, app, owner, map[string]any{"travellers": []string{profile.Id}})
	testutil.CreateRecord(t, app, "activities", map[string]any{
		"name": "Louvre", "address": "Rue de Rivoli",
		"startDate":  "2026-06-02 09:00:00.000Z",
		"trip":       trip.Id,
		"travellers": []string{profile.Id},
	})

	ics, _ := calendarFor(t, app, trip, owner)

	// the serializer folds long lines, so compare without the wrapping
	unfolded := strings.ReplaceAll(ics, "\r\n ", "")
	if !strings.Contains(unfolded, "Travellers: Frequent Flyer") {
		t.Errorf("calendar does not name the travellers\n%s", ics)
	}
}

// allTimezonesAvailable tells the UI whether to warn that times may be wrong,
// so it must be false only when an entry is actually missing its timezone.
func TestCalendarReportsMissingTimezones(t *testing.T) {
	cases := []struct {
		name       string
		collection string
		fields     map[string]any
		want       bool
	}{
		{
			name: "activity with a timezone", collection: "activities", want: true,
			fields: map[string]any{"name": "Louvre", "address": "a", "startDate": "2026-06-02 09:00:00.000Z", "metadata": place("Europe/Paris")},
		},
		{
			name: "activity without a timezone", collection: "activities", want: false,
			fields: map[string]any{"name": "Louvre", "address": "a", "startDate": "2026-06-02 09:00:00.000Z"},
		},
		{
			name: "lodging with a timezone", collection: "lodgings", want: true,
			fields: map[string]any{"type": "hotel", "name": "H", "address": "a", "startDate": "2026-06-01 15:00:00.000Z", "endDate": "2026-06-05 11:00:00.000Z", "metadata": place("Europe/Paris")},
		},
		{
			name: "lodging without a timezone", collection: "lodgings", want: false,
			fields: map[string]any{"type": "hotel", "name": "H", "address": "a", "startDate": "2026-06-01 15:00:00.000Z", "endDate": "2026-06-05 11:00:00.000Z"},
		},
		{
			name: "transportation with both timezones", collection: "transportations", want: true,
			fields: map[string]any{"type": "flight", "origin": "JFK", "destination": "CDG",
				"departureTime": "2026-06-01 10:00:00.000Z", "arrivalTime": "2026-06-01 22:00:00.000Z",
				"metadata": map[string]any{
					"origin":      map[string]any{"timezone": "America/New_York"},
					"destination": map[string]any{"timezone": "Europe/Paris"},
				}},
		},
		{
			name: "transportation missing the arrival timezone", collection: "transportations", want: false,
			fields: map[string]any{"type": "flight", "origin": "JFK", "destination": "CDG",
				"departureTime": "2026-06-01 10:00:00.000Z", "arrivalTime": "2026-06-01 22:00:00.000Z",
				"metadata": map[string]any{"origin": map[string]any{"timezone": "America/New_York"}}},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			app := testutil.NewApp(t)
			owner := testutil.CreateUser(t, app, "owner@example.com")
			trip := testutil.CreateTrip(t, app, owner, nil)

			fields := map[string]any{"trip": trip.Id}
			for k, v := range c.fields {
				fields[k] = v
			}
			testutil.CreateRecord(t, app, c.collection, fields)

			_, payload := calendarFor(t, app, trip, owner)
			if payload.AllTimezonesAvailable != c.want {
				t.Errorf("allTimezonesAvailable = %v, want %v", payload.AllTimezonesAvailable, c.want)
			}
		})
	}
}

func TestCalendarAppliesTheEntryTimezone(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	// 09:00 stored for a Paris activity is 09:00 local, which is 07:00 UTC
	testutil.CreateRecord(t, app, "activities", map[string]any{
		"name": "Louvre", "address": "Rue de Rivoli",
		"startDate": "2026-06-02 09:00:00.000Z",
		"trip":      trip.Id,
		"metadata":  place("Europe/Paris"),
	})

	ics, _ := calendarFor(t, app, trip, owner)

	if !strings.Contains(ics, "DTSTART:20260602T070000Z") {
		t.Errorf("the Paris timezone was not applied to the activity start\n%s", ics)
	}
}
