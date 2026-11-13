package assistant_test

import (
	"backend/assistant"
	"backend/testutil"
	bt "backend/types"
	"testing"
)

func TestMain(m *testing.M) { testutil.Main(m) }

var (
	paris     = bt.Destination{Id: "1", Name: "Paris", StateName: "Île-de-France", CountryName: "France"}
	newYork   = bt.Destination{Id: "2", Name: "New York", StateName: "New York", CountryName: "United States"}
	tokyo     = bt.Destination{Id: "3", Name: "Tokyo", StateName: "Tokyo", CountryName: "Japan"}
	allPlaces = []bt.Destination{paris, newYork, tokyo}
)

// The address comes from a booking email, so it rarely matches a destination
// exactly. A booking is only attached to a destination on a decent match.
func TestFuzzyMatchDestination(t *testing.T) {
	cases := []struct {
		name    string
		places  []bt.Destination
		address string
		want    string // the expected destination name, or "" for no match
	}{
		{"exact name", allPlaces, "Paris", "Paris"},
		{"different case", allPlaces, "paris", "Paris"},
		{"name within a street address", allPlaces, "12 Rue de Rivoli, Paris, France", "Paris"},
		{"country only", allPlaces, "Japan", "Tokyo"},
		{"state only", allPlaces, "Île-de-France", "Paris"},
		{"commas and dashes", allPlaces, "New-York, United States", "New York"},
		{"a multi word name", allPlaces, "somewhere in New York", "New York"},

		{"no destinations", nil, "Paris", ""},
		{"empty address", allPlaces, "", ""},
		{"nothing in common", allPlaces, "Reykjavik, Iceland", ""},
		{"too weak to count", allPlaces, "The Ne Bistro", ""},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			match := assistant.FuzzyMatchDestination(c.places, c.address)

			if c.want == "" {
				if match != nil {
					t.Errorf("matched %q, want no match", match.Name)
				}
				return
			}
			if match == nil {
				t.Fatalf("no match, want %q", c.want)
			}
			if match.Name != c.want {
				t.Errorf("matched %q, want %q", match.Name, c.want)
			}
		})
	}
}

// The best match wins rather than the first one that scores at all.
func TestFuzzyMatchDestinationPicksTheBestCandidate(t *testing.T) {
	places := []bt.Destination{
		{Id: "1", Name: "York", CountryName: "United Kingdom"},
		{Id: "2", Name: "New York", StateName: "New York", CountryName: "United States"},
	}

	match := assistant.FuzzyMatchDestination(places, "New York, United States")
	if match == nil {
		t.Fatal("no match")
	}
	if match.Id != "2" {
		t.Errorf("matched %q, want the more specific New York", match.Name)
	}
}
