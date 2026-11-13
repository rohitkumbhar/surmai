package flightaware_test

import (
	"backend/flights"
	"backend/flights/flightaware"
	"backend/testutil"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

// flightResponse builds an AeroAPI response for one flight.
func flightResponse(extra string) string {
	return fmt.Sprintf(`{
	  "num_pages": 1,
	  "flights": [{
	    "ident": "AA100",
	    "operator": "American Airlines",
	    "flight_number": "100",
	    "origin": {"code_iata": "JFK", "name": "John F Kennedy Intl", "timezone": "America/New_York"},
	    "destination": {"code_iata": "LHR", "name": "London Heathrow", "timezone": "Europe/London"}
	    %s
	  }]
	}`, extra)
}

func serve(t testing.TB, handler http.HandlerFunc) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	return server
}

func TestGetFlightRoute(t *testing.T) {
	var path, query, apiKey string
	server := serve(t, func(w http.ResponseWriter, r *http.Request) {
		path, query, apiKey = r.URL.Path, r.URL.RawQuery, r.Header.Get("x-apikey")
		_, _ = w.Write([]byte(flightResponse(`,"scheduled_out": "2026-06-01T10:00:00Z", "scheduled_in": "2026-06-01T22:00:00Z"`)))
	})

	provider := flightaware.FlightAware{BaseURL: server.URL}
	config := &flights.FlightInfoProviderConfig{ApiKey: "secret-key"}

	route, err := provider.GetFlightRoute("AA100", config, testutil.TimezoneFinder())
	if err != nil {
		t.Fatal(err)
	}

	if path != "/flights/AA100" {
		t.Errorf("requested path %q, want /flights/AA100", path)
	}
	if query != "ident_type=designator" {
		t.Errorf("query = %q, want ident_type=designator", query)
	}
	if apiKey != "secret-key" {
		t.Errorf("x-apikey header = %q, want the configured key", apiKey)
	}

	if route.Origin.IataCode != "JFK" || route.Destination.IataCode != "LHR" {
		t.Errorf("route = %s -> %s, want JFK -> LHR", route.Origin.IataCode, route.Destination.IataCode)
	}
	// unlike adsbdb, FlightAware reports the airport time zones itself
	if route.Origin.Timezone != "America/New_York" || route.Destination.Timezone != "Europe/London" {
		t.Errorf("time zones = %s / %s", route.Origin.Timezone, route.Destination.Timezone)
	}
	if route.Airline.Name != "American Airlines" {
		t.Errorf("airline = %q, want American Airlines", route.Airline.Name)
	}
	if got := route.DepartureTime.UTC().Format("2006-01-02T15:04:05Z"); got != "2026-06-01T10:00:00Z" {
		t.Errorf("departure = %q, want the scheduled time", got)
	}
	if got := route.ArrivalTime.UTC().Format("2006-01-02T15:04:05Z"); got != "2026-06-01T22:00:00Z" {
		t.Errorf("arrival = %q, want the scheduled time", got)
	}
}

// Actual times are preferred over estimated, and estimated over scheduled.
func TestGetFlightRoutePrefersTheMostCertainTimes(t *testing.T) {
	cases := []struct {
		name  string
		extra string
		want  string
	}{
		{"actual wins", `,"actual_out":"2026-06-01T10:30:00Z","estimated_out":"2026-06-01T10:15:00Z","scheduled_out":"2026-06-01T10:00:00Z"`, "2026-06-01T10:30:00Z"},
		{"estimated next", `,"estimated_out":"2026-06-01T10:15:00Z","scheduled_out":"2026-06-01T10:00:00Z"`, "2026-06-01T10:15:00Z"},
		{"scheduled last", `,"scheduled_out":"2026-06-01T10:00:00Z"`, "2026-06-01T10:00:00Z"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			server := serve(t, func(w http.ResponseWriter, r *http.Request) {
				_, _ = w.Write([]byte(flightResponse(c.extra)))
			})

			provider := flightaware.FlightAware{BaseURL: server.URL}
			route, err := provider.GetFlightRoute("AA100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder())
			if err != nil {
				t.Fatal(err)
			}
			if got := route.DepartureTime.UTC().Format("2006-01-02T15:04:05Z"); got != c.want {
				t.Errorf("departure = %q, want %q", got, c.want)
			}
		})
	}
}

func TestGetFlightRouteLeavesUnparsableTimesUnset(t *testing.T) {
	server := serve(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(flightResponse(`,"scheduled_out": "not a timestamp"`)))
	})

	provider := flightaware.FlightAware{BaseURL: server.URL}
	route, err := provider.GetFlightRoute("AA100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder())
	if err != nil {
		t.Fatal(err)
	}
	if !route.DepartureTime.IsZero() {
		t.Errorf("departure = %v, want the zero time", route.DepartureTime)
	}
}

func TestGetFlightRouteErrors(t *testing.T) {
	cases := []struct {
		name   string
		status int
		body   string
	}{
		{"bad api key", http.StatusUnauthorized, `{"title":"Unauthorized"}`},
		{"rate limited", http.StatusTooManyRequests, ``},
		{"body is not json", http.StatusOK, `<html>nope</html>`},
		{"no flights for the number", http.StatusOK, `{"num_pages":1,"flights":[]}`},
		{"flight is cancelled", http.StatusOK, `{"flights":[{"ident":"AA100","cancelled":true}]}`},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			server := serve(t, func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(c.status)
				_, _ = w.Write([]byte(c.body))
			})

			provider := flightaware.FlightAware{BaseURL: server.URL}
			if _, err := provider.GetFlightRoute("AA100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder()); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}
