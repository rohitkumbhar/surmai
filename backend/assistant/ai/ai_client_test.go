package ai_test

import (
	"backend/assistant/ai"
	"backend/testutil"
	bt "backend/types"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

func TestMain(m *testing.M) { testutil.Main(m) }

// responsesReply is the smallest Responses API payload the SDK will read.
func responsesReply(text string) string {
	encoded, err := json.Marshal(text)
	if err != nil {
		panic(err)
	}
	return fmt.Sprintf(`{
	  "id": "resp_1",
	  "object": "response",
	  "created_at": 1800000000,
	  "model": "test-model",
	  "status": "completed",
	  "output": [{
	    "id": "msg_1",
	    "type": "message",
	    "role": "assistant",
	    "status": "completed",
	    "content": [{"type": "output_text", "text": %s, "annotations": []}]
	  }]
	}`, encoded)
}

type capturedRequest struct {
	path   string
	apiKey string
	body   map[string]any
}

// stubOpenAi serves one Responses API reply and points the app's AI config at it.
func stubOpenAi(t testing.TB, app *tests.TestApp, handler http.HandlerFunc) *capturedRequest {
	t.Helper()

	captured := &capturedRequest{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured.path = r.URL.Path
		captured.apiKey = strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		_ = json.NewDecoder(r.Body).Decode(&captured.body)
		w.Header().Set("Content-Type", "application/json")
		handler(w, r)
	}))
	t.Cleanup(server.Close)

	record, err := app.FindRecordById("surmai_settings", "openai_endpoint_config")
	if err != nil {
		t.Fatal(err)
	}
	value, err := json.Marshal(map[string]any{
		"enabled":  true,
		"endpoint": server.URL,
		"apiKey":   "test-key",
		"model":    "test-model",
	})
	if err != nil {
		t.Fatal(err)
	}
	record.Set("value", string(value))
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}

	return captured
}

func TestTestConnection(t *testing.T) {
	app := testutil.NewApp(t)
	captured := stubOpenAi(t, app, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(responsesReply("pong")))
	})

	answer, err := ai.TestConnection(app, "ping")
	if err != nil {
		t.Fatal(err)
	}
	if answer != "pong" {
		t.Errorf("answer = %q, want pong", answer)
	}

	if !strings.HasSuffix(captured.path, "/responses") {
		t.Errorf("called %q, want the responses endpoint", captured.path)
	}
	if captured.apiKey != "test-key" {
		t.Errorf("api key = %q, want the configured key", captured.apiKey)
	}
	if captured.body["model"] != "test-model" {
		t.Errorf("model = %v, want the configured model", captured.body["model"])
	}
	if captured.body["input"] != "ping" {
		t.Errorf("input = %v, want the prompt", captured.body["input"])
	}
}

func TestTestConnectionErrors(t *testing.T) {
	t.Run("the endpoint returns an error", func(t *testing.T) {
		app := testutil.NewApp(t)
		stubOpenAi(t, app, func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":{"message":"bad key"}}`))
		})

		if _, err := ai.TestConnection(app, "ping"); err == nil {
			t.Error("expected an error, got none")
		}
	})

	t.Run("no endpoint is configured", func(t *testing.T) {
		app := testutil.NewApp(t)
		if _, err := ai.TestConnection(app, "ping"); err == nil {
			t.Error("expected an error when the assistant is unconfigured")
		}
	})
}

func TestCallReturnsTheParsedResult(t *testing.T) {
	app := testutil.NewApp(t)
	captured := stubOpenAi(t, app, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(responsesReply(`{"category":"hotel_reservation","hotels":[{"name":"Hotel Rivoli","type":"hotel"}]}`)))
	})

	resultChan := make(chan ai.CallResult[bt.EmailScanResult])
	ai.Call(app, "classify this", "Subject: booking", resultChan)
	result := <-resultChan

	if result.Err != nil {
		t.Fatal(result.Err)
	}
	if result.Result.Category != "hotel_reservation" {
		t.Errorf("category = %q", result.Result.Category)
	}
	if len(result.Result.Hotels) != 1 || result.Result.Hotels[0].Name != "Hotel Rivoli" {
		t.Errorf("hotels = %+v", result.Result.Hotels)
	}

	// the call asks for a structured reply matching the result type
	if captured.body["instructions"] != "classify this" {
		t.Errorf("instructions = %v", captured.body["instructions"])
	}
	text, _ := captured.body["text"].(map[string]any)
	format, _ := text["format"].(map[string]any)
	if format["type"] != "json_schema" {
		t.Errorf("response format = %v, want a json schema", format)
	}
	if schema, ok := format["schema"].(map[string]any); !ok || schema["properties"] == nil {
		t.Errorf("no schema was sent: %v", format)
	}
}

func TestCallReportsFailures(t *testing.T) {
	cases := map[string]http.HandlerFunc{
		"the endpoint fails": func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		},
		"the reply is not the expected shape": func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(responsesReply(`not json at all`)))
		},
	}

	for name, handler := range cases {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			stubOpenAi(t, app, handler)

			resultChan := make(chan ai.CallResult[bt.EmailScanResult])
			ai.Call(app, "classify", "input", resultChan)
			result := <-resultChan

			if result.Err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

// The schema is what makes the model reply in a shape we can unmarshal.
func TestGenerateSchema(t *testing.T) {
	schema := ai.GenerateSchema[bt.EmailScanResult]()

	properties, ok := schema["properties"].(map[string]any)
	if !ok {
		t.Fatalf("schema has no properties: %v", schema)
	}
	for _, field := range []string{"category", "flights", "hotels", "activities", "rentals", "parkings", "transportations"} {
		if _, ok := properties[field]; !ok {
			t.Errorf("schema is missing %q", field)
		}
	}
	if schema["additionalProperties"] != false {
		t.Error("the schema should not allow additional properties")
	}
}
