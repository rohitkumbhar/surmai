package hooks_test

import (
	"backend/testutil"
	bt "backend/types"
	"encoding/json"
	"testing"
)

func TestAddTimezoneToDestinations(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")

	trip := testutil.CreateTrip(t, app, owner, map[string]any{
		"destinations": []map[string]any{
			{"id": "paris", "name": "Paris", "latitude": "48.8566", "longitude": "2.3522"},
			{"id": "tokyo", "name": "Tokyo", "latitude": "35.6762", "longitude": "139.6503", "timezone": "Custom/Zone"},
			{"id": "nowhere", "name": "No coordinates"},
		},
	})

	var destinations []bt.Destination
	if err := json.Unmarshal([]byte(trip.GetString("destinations")), &destinations); err != nil {
		t.Fatal(err)
	}

	expected := map[string]string{
		"paris":   "Europe/Paris", // looked up from coordinates
		"tokyo":   "Custom/Zone",  // an existing timezone is kept
		"nowhere": "",             // nothing to look up
	}

	if len(destinations) != len(expected) {
		t.Fatalf("expected %d destinations, got %d", len(expected), len(destinations))
	}
	for _, destination := range destinations {
		if got := destination.TimeZone; got != expected[destination.Id] {
			t.Errorf("destination %s: expected timezone %q, got %q", destination.Id, expected[destination.Id], got)
		}
	}
}

func TestAddTimezoneToDestinationsOnUpdate(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	trip.Set("destinations", []map[string]any{
		{"id": "nyc", "name": "New York", "latitude": "40.7128", "longitude": "-74.0060"},
	})
	if err := app.Save(trip); err != nil {
		t.Fatal(err)
	}

	var destinations []bt.Destination
	if err := json.Unmarshal([]byte(trip.GetString("destinations")), &destinations); err != nil {
		t.Fatal(err)
	}
	if len(destinations) != 1 || destinations[0].TimeZone != "America/New_York" {
		t.Fatalf("expected America/New_York, got %+v", destinations)
	}
}
