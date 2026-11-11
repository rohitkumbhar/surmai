package jobs_test

import (
	"backend/jobs"
	"backend/testutil"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/tests"
)

const ratesResponse = `{
  "result": "success",
  "base_code": "USD",
  "time_last_update_utc": "Wed, 11 Nov 2026 00:00:01 +0000",
  "rates": {"USD": 1, "EUR": 0.92, "GBP": 0.79, "JPY": 151.2}
}`

// rateServer serves a canned exchange rate response and counts the calls.
func rateServer(t testing.TB, status int, body string) (*httptest.Server, *atomic.Int32) {
	t.Helper()

	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.URL.Path != "/v6/latest/USD" {
			t.Errorf("requested %q, want /v6/latest/USD", r.URL.Path)
		}
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)

	return server, &calls
}

func rateFor(t testing.TB, app *tests.TestApp, code string) float64 {
	t.Helper()

	record, err := app.FindFirstRecordByData("currency_conversions", "currencyCode", code)
	if err != nil {
		t.Fatalf("no conversion record for %s: %v", code, err)
	}
	return record.GetFloat("conversionRate")
}

func TestSyncCurrencyDataCreatesRates(t *testing.T) {
	app := testutil.NewApp(t)
	server, calls := rateServer(t, http.StatusOK, ratesResponse)

	job := &jobs.SyncCurrencyDataJob{App: app, BaseURL: server.URL}
	job.Execute()

	if got := calls.Load(); got != 1 {
		t.Errorf("the API was called %d times, want 1", got)
	}

	count, err := app.CountRecords("currency_conversions")
	if err != nil {
		t.Fatal(err)
	}
	if count != 4 {
		t.Errorf("stored %d rates, want 4", count)
	}
	if got := rateFor(t, app, "EUR"); got != 0.92 {
		t.Errorf("EUR rate = %v, want 0.92", got)
	}
	if got := rateFor(t, app, "JPY"); got != 151.2 {
		t.Errorf("JPY rate = %v, want 151.2", got)
	}
}

func TestSyncCurrencyDataUpdatesExistingRates(t *testing.T) {
	app := testutil.NewApp(t)

	// an existing rate, last updated long enough ago that a sync is due
	existing := testutil.CreateRecord(t, app, "currency_conversions", map[string]any{
		"currencyCode": "EUR", "conversionRate": 0.5,
	})
	if _, err := app.DB().NewQuery("UPDATE currency_conversions SET updated = {:old} WHERE id = {:id}").
		Bind(dbx.Params{"old": ago(48 * time.Hour), "id": existing.Id}).Execute(); err != nil {
		t.Fatal(err)
	}

	server, _ := rateServer(t, http.StatusOK, ratesResponse)
	job := &jobs.SyncCurrencyDataJob{App: app, BaseURL: server.URL}
	job.Execute()

	if got := rateFor(t, app, "EUR"); got != 0.92 {
		t.Errorf("EUR rate = %v, want it updated to 0.92", got)
	}

	// updating leaves the existing rows in place rather than adding more
	count, err := app.CountRecords("currency_conversions")
	if err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Errorf("stored %d rates, want the single existing row updated", count)
	}
}

// Rates are refreshed at most once a day.
func TestSyncCurrencyDataSkipsWhenRatesAreFresh(t *testing.T) {
	app := testutil.NewApp(t)
	testutil.CreateRecord(t, app, "currency_conversions", map[string]any{
		"currencyCode": "EUR", "conversionRate": 0.5,
	})

	server, calls := rateServer(t, http.StatusOK, ratesResponse)
	job := &jobs.SyncCurrencyDataJob{App: app, BaseURL: server.URL}
	job.Execute()

	if got := calls.Load(); got != 0 {
		t.Errorf("the API was called %d times, want 0 while the rates are fresh", got)
	}
	if got := rateFor(t, app, "EUR"); got != 0.5 {
		t.Errorf("EUR rate = %v, want it left at 0.5", got)
	}
}

func TestSyncCurrencyDataLeavesRatesAloneOnFailure(t *testing.T) {
	cases := map[string]struct {
		status int
		body   string
	}{
		"server error":       {http.StatusInternalServerError, ``},
		"rate limited":       {http.StatusTooManyRequests, ``},
		"body is not json":   {http.StatusOK, `<html>nope</html>`},
		"result not success": {http.StatusOK, `{"result":"error","error-type":"invalid-key"}`},
	}

	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			server, _ := rateServer(t, c.status, c.body)

			job := &jobs.SyncCurrencyDataJob{App: app, BaseURL: server.URL}
			job.Execute() // must not panic

			count, err := app.CountRecords("currency_conversions")
			if err != nil {
				t.Fatal(err)
			}
			if count != 0 {
				t.Errorf("stored %d rates, want none after a failed fetch", count)
			}
		})
	}
}

func TestSyncCurrencyDataWhenTheApiIsUnreachable(t *testing.T) {
	app := testutil.NewApp(t)
	server, _ := rateServer(t, http.StatusOK, ratesResponse)
	server.Close()

	job := &jobs.SyncCurrencyDataJob{App: app, BaseURL: server.URL}
	job.Execute() // must not panic

	count, _ := app.CountRecords("currency_conversions")
	if count != 0 {
		t.Errorf("stored %d rates, want none", count)
	}
}
