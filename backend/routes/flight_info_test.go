package routes_test

import (
	"backend/testutil"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

// setFlightProvider points the stored flight provider config at a test server.
func setFlightProvider(t testing.TB, app *tests.TestApp, provider, baseURL string) {
	t.Helper()

	record, err := app.FindRecordById("surmai_settings", "flight_info_provider")
	if err != nil {
		t.Fatal(err)
	}
	value, err := json.Marshal(map[string]any{
		"enabled":  true,
		"provider": provider,
		"apiKey":   "test-key",
		"baseUrl":  baseURL,
	})
	if err != nil {
		t.Fatal(err)
	}
	record.Set("value", string(value))
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}
}

const adsbdbRoute = `{"response":{"flightroute":{
  "airline":{"name":"American Airlines"},
  "origin":{"iata_code":"JFK","name":"JFK","country_iso_name":"US","latitude":40.6398,"longitude":-73.7789},
  "destination":{"iata_code":"LHR","name":"LHR","country_iso_name":"GB","latitude":51.4706,"longitude":-0.4619}
}}}`

func TestFlightRouteLookup(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		_, _ = w.Write([]byte(adsbdbRoute))
	}))
	defer server.Close()
	setFlightProvider(t, app, "adsbdb", server.URL)

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodGet, "/api/surmai/flight-route/AA100", "", user)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", recorder.Code, testutil.Body(t, recorder))
	}
	body := testutil.Body(t, recorder)
	for _, want := range []string{`"iataCode":"JFK"`, `"iataCode":"LHR"`, "American Airlines"} {
		if !strings.Contains(body, want) {
			t.Errorf("response is missing %q: %s", want, body)
		}
	}

	// a second lookup for the same flight is served from the cache
	client.Request(http.MethodGet, "/api/surmai/flight-route/AA100", "", user)
	if got := calls.Load(); got != 1 {
		t.Errorf("the provider was called %d times, want 1 (the second lookup should be cached)", got)
	}
}

func TestFlightRouteLookupWhenTheFlightIsUnknown(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	setFlightProvider(t, app, "adsbdb", server.URL)

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodGet, "/api/surmai/flight-route/ZZ999", "", user)
	if recorder.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", recorder.Code)
	}

	// a failed lookup is cached too, so the provider is not asked again
	recorder = client.Request(http.MethodGet, "/api/surmai/flight-route/ZZ999", "", user)
	if recorder.Code != http.StatusNotFound {
		t.Errorf("status = %d on the cached lookup, want 404", recorder.Code)
	}
	if got := calls.Load(); got != 1 {
		t.Errorf("the provider was called %d times, want 1", got)
	}
}

func TestFlightRouteLookupWithAnUnknownProvider(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")
	setFlightProvider(t, app, "not-a-provider", "")

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodGet, "/api/surmai/flight-route/AA100", "", user)
	if recorder.Code == http.StatusOK {
		t.Errorf("status = %d, want an error for an unconfigured provider", recorder.Code)
	}
}

func TestFlightRouteLookupRequiresSigningIn(t *testing.T) {
	scenario := tests.ApiScenario{
		Name:            "anonymous flight lookup",
		Method:          http.MethodGet,
		URL:             "/api/surmai/flight-route/AA100",
		TestAppFactory:  testutil.AppFactory(nil),
		ExpectedStatus:  http.StatusUnauthorized,
		ExpectedContent: []string{"requires valid record authorization token"},
	}
	scenario.Test(t)
}
