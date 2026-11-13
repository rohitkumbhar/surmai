package testutil

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// Client sends requests to a test app through the real router, so route
// handlers run behind their middleware exactly as they do when serving.
//
// It is for tests that need to inspect a response body. Use tests.ApiScenario
// when asserting status codes and response substrings.
type Client struct {
	t   testing.TB
	mux http.Handler
}

// NewClient builds the router for the given test app.
func NewClient(t testing.TB, app *tests.TestApp) *Client {
	t.Helper()

	router, err := apis.NewRouter(app)
	if err != nil {
		t.Fatalf("could not build the router: %v", err)
	}

	event := &core.ServeEvent{App: app, Router: router}
	if err := app.OnServe().Trigger(event, func(e *core.ServeEvent) error { return e.Next() }); err != nil {
		t.Fatalf("OnServe failed: %v", err)
	}

	mux, err := event.Router.BuildMux()
	if err != nil {
		t.Fatalf("could not build the mux: %v", err)
	}

	return &Client{t: t, mux: mux}
}

// Request sends a request authenticated as the given record, or anonymously
// when auth is nil.
func (c *Client) Request(method, url, body string, auth *core.Record) *httptest.ResponseRecorder {
	c.t.Helper()

	request := httptest.NewRequest(method, url, strings.NewReader(body))
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}
	if auth != nil {
		request.Header.Set("Authorization", AuthToken(c.t, auth))
	}

	recorder := httptest.NewRecorder()
	c.mux.ServeHTTP(recorder, request)

	return recorder
}

// Body returns the response body as a string.
func Body(t testing.TB, recorder *httptest.ResponseRecorder) string {
	t.Helper()

	content, err := io.ReadAll(recorder.Body)
	if err != nil {
		t.Fatal(err)
	}
	return string(content)
}
