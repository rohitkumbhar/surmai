package email_test

import (
	"backend/assistant/ai"
	"backend/assistant/email"
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

// stubAssistant points the app's AI config at a server that returns the given
// classification, and records the input the email was turned into.
func stubAssistant(t testing.TB, app *tests.TestApp, classification string) *string {
	t.Helper()

	input := new(string)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Input string `json:"input"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		*input = body.Input

		encoded, _ := json.Marshal(classification)
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprintf(w, `{
		  "id":"resp_1","object":"response","created_at":1800000000,
		  "model":"test-model","status":"completed",
		  "output":[{"id":"msg_1","type":"message","role":"assistant","status":"completed",
		    "content":[{"type":"output_text","text":%s,"annotations":[]}]}]
		}`, encoded)
	}))
	t.Cleanup(server.Close)

	record, err := app.FindRecordById("surmai_settings", "openai_endpoint_config")
	if err != nil {
		t.Fatal(err)
	}
	value, _ := json.Marshal(map[string]any{
		"enabled": true, "endpoint": server.URL, "apiKey": "k", "model": "test-model",
	})
	record.Set("value", string(value))
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}

	return input
}

func TestExtractEmailInfo(t *testing.T) {
	app := testutil.NewApp(t)
	input := stubAssistant(t, app, `{"category":"flight_reservation","flights":[{"flight_number":"AF007","departure_airport_code":"JFK"}]}`)

	result, err := email.ExtractEmailInfo(app, &bt.Email{
		Subject:  "Your flight confirmation",
		TextBody: "Flight AF007 from JFK",
	})
	if err != nil {
		t.Fatal(err)
	}

	if result.Category != email.FlightReservation {
		t.Errorf("category = %q, want %q", result.Category, email.FlightReservation)
	}
	if len(result.Flights) != 1 || result.Flights[0].FlightNumber != "AF007" {
		t.Errorf("flights = %+v", result.Flights)
	}

	// the subject and body are both given to the model
	if !strings.Contains(*input, "Your flight confirmation") || !strings.Contains(*input, "Flight AF007 from JFK") {
		t.Errorf("input sent to the model = %q", *input)
	}
}

// Many booking emails are HTML only, and are converted to text first so the
// markup does not take up the model's context.
func TestExtractEmailInfoConvertsHtmlOnlyEmails(t *testing.T) {
	app := testutil.NewApp(t)
	input := stubAssistant(t, app, `{"category":"unknown"}`)

	if _, err := email.ExtractEmailInfo(app, &bt.Email{
		Subject:  "Booking",
		HTMLBody: "<html><body><h1>Hotel Rivoli</h1><p>Check in <b>2 June</b></p></body></html>",
	}); err != nil {
		t.Fatal(err)
	}

	if strings.Contains(*input, "<h1>") || strings.Contains(*input, "<body>") {
		t.Errorf("the HTML markup was sent to the model: %q", *input)
	}
	for _, want := range []string{"Hotel Rivoli", "2 June"} {
		if !strings.Contains(*input, want) {
			t.Errorf("input is missing %q: %q", want, *input)
		}
	}
}

// A plain text body is preferred when both are present.
func TestExtractEmailInfoPrefersTheTextBody(t *testing.T) {
	app := testutil.NewApp(t)
	input := stubAssistant(t, app, `{"category":"unknown"}`)

	if _, err := email.ExtractEmailInfo(app, &bt.Email{
		Subject:  "Booking",
		TextBody: "the plain text version",
		HTMLBody: "<p>the html version</p>",
	}); err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(*input, "the plain text version") {
		t.Errorf("input = %q, want the text body", *input)
	}
	if strings.Contains(*input, "the html version") {
		t.Errorf("input = %q, want the HTML body left out", *input)
	}
}

func TestExtractEmailInfoWithNoMessage(t *testing.T) {
	app := testutil.NewApp(t)
	stubAssistant(t, app, `{"category":"unknown"}`)

	if _, err := email.ExtractEmailInfo(app, nil); err == nil {
		t.Error("expected an error for a nil message")
	}
}

func TestExtractEmailInfoWhenTheAssistantIsUnconfigured(t *testing.T) {
	app := testutil.NewApp(t)

	if _, err := email.ExtractEmailInfo(app, &bt.Email{Subject: "Booking", TextBody: "..."}); err == nil {
		t.Error("expected an error when the assistant is unconfigured")
	}
}

// The categories are the values the model is told to choose from, so they have
// to keep matching the schema enum in the classification instruction.
func TestCategoriesAreOfferedToTheModel(t *testing.T) {
	for _, category := range []bt.EmailCategory{
		email.Unknown,
		email.FlightReservation,
		email.GenericTransportation,
		email.CarRentalReservation,
		email.AccommodationReservation,
		email.ExpenseReceipt,
		email.ActivityReservation,
		email.ParkingReservation,
	} {
		if !strings.Contains(schemaEnum(t), string(category)) {
			t.Errorf("category %q is not in the response schema", category)
		}
	}
}

func schemaEnum(t testing.TB) string {
	t.Helper()

	schema, err := json.Marshal(ai.GenerateSchema[bt.EmailScanResult]())
	if err != nil {
		t.Fatal(err)
	}
	return string(schema)
}
