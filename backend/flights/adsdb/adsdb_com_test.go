package adsdb_test

import (
	"backend/flights"
	"backend/flights/adsdb"
	"backend/testutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

const routeResponse = `{
  "response": {
    "flightroute": {
      "callsign": "AAL100",
      "airline": {"name": "American Airlines", "iata": "AA"},
      "origin": {
        "iata_code": "JFK", "name": "John F Kennedy International",
        "country_iso_name": "US", "latitude": 40.639801, "longitude": -73.7789
      },
      "destination": {
        "iata_code": "LHR", "name": "London Heathrow",
        "country_iso_name": "GB", "latitude": 51.4706, "longitude": -0.461941
      }
    }
  }
}`

// stub serves a single canned response.
func stub(t testing.TB, status int, body string) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)

	return server
}

func TestGetFlightRoute(t *testing.T) {
	var path string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		_, _ = w.Write([]byte(routeResponse))
	}))
	defer server.Close()

	provider := adsdb.AdsbDbCom{BaseURL: server.URL}
	route, err := provider.GetFlightRoute("AAL100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder())
	if err != nil {
		t.Fatal(err)
	}

	if path != "/v0/callsign/AAL100" {
		t.Errorf("requested %q, want /v0/callsign/AAL100", path)
	}
	if route.Origin.IataCode != "JFK" || route.Destination.IataCode != "LHR" {
		t.Errorf("route = %s -> %s, want JFK -> LHR", route.Origin.IataCode, route.Destination.IataCode)
	}
	if route.Airline.Name != "American Airlines" {
		t.Errorf("airline = %q, want American Airlines", route.Airline.Name)
	}
	// the timezone is derived from the coordinates, not the response
	if route.Origin.Timezone != "America/New_York" {
		t.Errorf("origin timezone = %q, want America/New_York", route.Origin.Timezone)
	}
	if route.Destination.Timezone != "Europe/London" {
		t.Errorf("destination timezone = %q, want Europe/London", route.Destination.Timezone)
	}
}

func TestGetFlightRouteErrors(t *testing.T) {
	cases := []struct {
		name   string
		status int
		body   string
	}{
		{"unknown flight", http.StatusNotFound, `{"response":"unknown callsign"}`},
		{"rate limited", http.StatusTooManyRequests, ``},
		{"server error", http.StatusInternalServerError, `oops`},
		{"body is not json", http.StatusOK, `<html>not json</html>`},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			server := stub(t, c.status, c.body)

			provider := adsdb.AdsbDbCom{BaseURL: server.URL}
			if _, err := provider.GetFlightRoute("AAL100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder()); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

func TestGetFlightRouteWhenTheProviderIsUnreachable(t *testing.T) {
	server := stub(t, http.StatusOK, routeResponse)
	server.Close() // nothing is listening any more

	provider := adsdb.AdsbDbCom{BaseURL: server.URL}
	if _, err := provider.GetFlightRoute("AAL100", &flights.FlightInfoProviderConfig{}, testutil.TimezoneFinder()); err == nil {
		t.Error("expected an error, got none")
	}
}

func TestDefaultBaseUrlIsThePublicApi(t *testing.T) {
	if got := flights.BaseURL("", adsdb.DefaultBaseURL); got != "https://api.adsbdb.com" {
		t.Errorf("default base URL = %q", got)
	}
	if got := flights.BaseURL("http://localhost:1234", adsdb.DefaultBaseURL); got != "http://localhost:1234" {
		t.Errorf("configured base URL was not used, got %q", got)
	}
}

func TestDefaultClientHasATimeout(t *testing.T) {
	if flights.Client(nil).Timeout != flights.DefaultTimeout {
		t.Error("the default provider client should have a timeout")
	}
	custom := &http.Client{}
	if flights.Client(custom) != custom {
		t.Error("a supplied client should be used as given")
	}
}
