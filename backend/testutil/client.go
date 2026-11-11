package testutil

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
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

var (
	clientsMu sync.Mutex
	clients   = map[*tests.TestApp]*Client{}
)

// NewClient returns a client for the given test app, building its router on
// first use. The router can only be built once per app: building it triggers
// OnServe, and a second build would register every route twice and panic.
func NewClient(t testing.TB, app *tests.TestApp) *Client {
	t.Helper()

	clientsMu.Lock()
	defer clientsMu.Unlock()

	if existing, ok := clients[app]; ok {
		return existing
	}

	client := newClient(t, app)
	clients[app] = client
	t.Cleanup(func() {
		clientsMu.Lock()
		delete(clients, app)
		clientsMu.Unlock()
	})

	return client
}

func newClient(t testing.TB, app *tests.TestApp) *Client {
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

// Multipart describes a multipart/form-data body: form values plus files
// given as a field name mapped to a file name and its content.
type Multipart struct {
	Values map[string]string
	Files  map[string]MultipartFile
}

// MultipartFile is one uploaded file.
type MultipartFile struct {
	Name    string
	Content []byte
}

// RequestMultipart sends a multipart/form-data request, as the save-entity
// routes expect.
func (c *Client) RequestMultipart(method, url string, form Multipart, auth *core.Record) *httptest.ResponseRecorder {
	c.t.Helper()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	for name, value := range form.Values {
		if err := writer.WriteField(name, value); err != nil {
			c.t.Fatal(err)
		}
	}
	for field, file := range form.Files {
		part, err := writer.CreateFormFile(field, file.Name)
		if err != nil {
			c.t.Fatal(err)
		}
		if _, err := part.Write(file.Content); err != nil {
			c.t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		c.t.Fatal(err)
	}

	request := httptest.NewRequest(method, url, &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if auth != nil {
		request.Header.Set("Authorization", AuthToken(c.t, auth))
	}

	recorder := httptest.NewRecorder()
	c.mux.ServeHTTP(recorder, request)

	return recorder
}
