package settings_test

import (
	"backend/flights/adsdb"
	"backend/flights/flightaware"
	"backend/settings"
	"backend/testutil"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

func TestMain(m *testing.M) { testutil.Main(m) }

// storeConfig writes a settings record's value, as the admin screens do.
func storeConfig(t testing.TB, app *tests.TestApp, id, value string) {
	t.Helper()

	record, err := app.FindRecordById("surmai_settings", id)
	if err != nil {
		t.Fatal(err)
	}
	record.Set("value", value)
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}
}

func TestFetchFlightInfoProvider(t *testing.T) {
	cases := []struct {
		name     string
		value    string
		wantType any
		wantKey  string
		wantBase string
	}{
		{
			name:     "adsbdb",
			value:    `{"enabled":true,"provider":"adsbdb"}`,
			wantType: adsdb.AdsbDbCom{},
		},
		{
			name:     "flightaware with a key",
			value:    `{"enabled":true,"provider":"flightaware","apiKey":"secret"}`,
			wantType: flightaware.FlightAware{},
			wantKey:  "secret",
		},
		{
			name:     "a provider behind a different address",
			value:    `{"enabled":true,"provider":"adsbdb","baseUrl":"http://localhost:9999"}`,
			wantType: adsdb.AdsbDbCom{BaseURL: "http://localhost:9999"},
			wantBase: "http://localhost:9999",
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			app := testutil.NewApp(t)
			storeConfig(t, app, "flight_info_provider", c.value)

			config, provider, err := settings.FetchFlightInfoProvider(app)
			if err != nil {
				t.Fatal(err)
			}
			if !config.Enabled {
				t.Error("the config should be enabled")
			}
			if config.ApiKey != c.wantKey {
				t.Errorf("apiKey = %q, want %q", config.ApiKey, c.wantKey)
			}
			if config.BaseUrl != c.wantBase {
				t.Errorf("baseUrl = %q, want %q", config.BaseUrl, c.wantBase)
			}
			if provider != c.wantType {
				t.Errorf("provider = %#v, want %#v", provider, c.wantType)
			}
		})
	}
}

func TestFetchFlightInfoProviderErrors(t *testing.T) {
	cases := map[string]string{
		"unknown provider":  `{"enabled":true,"provider":"not-a-provider"}`,
		"no provider set":   `{"enabled":true}`,
		"value is not json": `not json at all`,
	}

	for name, value := range cases {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			storeConfig(t, app, "flight_info_provider", value)

			if _, _, err := settings.FetchFlightInfoProvider(app); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

func TestFetchAiConfig(t *testing.T) {
	app := testutil.NewApp(t)
	storeConfig(t, app, "openai_endpoint_config",
		`{"endpoint":"https://ai.example.com/v1","apiKey":"secret","model":"some-model","enabled":true}`)

	config, err := settings.FetchAiConfig(app)
	if err != nil {
		t.Fatal(err)
	}
	if config.Endpoint != "https://ai.example.com/v1" {
		t.Errorf("endpoint = %q", config.Endpoint)
	}
	if config.ApiKey != "secret" {
		t.Errorf("apiKey = %q", config.ApiKey)
	}
}

// An endpoint is required, so a config without one is an error rather than a
// client pointed at nothing.
func TestFetchAiConfigErrors(t *testing.T) {
	cases := map[string]string{
		"no endpoint":       `{"apiKey":"secret","enabled":true}`,
		"value is not json": `{ broken`,
	}

	for name, value := range cases {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			storeConfig(t, app, "openai_endpoint_config", value)

			if _, err := settings.FetchAiConfig(app); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

func TestFetchEmailSyncConfig(t *testing.T) {
	app := testutil.NewApp(t)
	storeConfig(t, app, "email_sync_config",
		`{"enabled":true,"imapHost":"imap.example.com","imapPort":993,"imapUser":"inbox@example.com","imapPassword":"secret","filterEmailAddress":"bookings@example.com"}`)

	config, err := settings.FetchEmailSyncConfig(app)
	if err != nil {
		t.Fatal(err)
	}
	if !config.Enabled {
		t.Error("the config should be enabled")
	}
	if config.ImapHost != "imap.example.com" {
		t.Errorf("imapHost = %q", config.ImapHost)
	}
	if config.ImapPort != 993 {
		t.Errorf("imapPort = %d, want 993", config.ImapPort)
	}
	if config.FilterEmailAddress != "bookings@example.com" {
		t.Errorf("filterEmailAddress = %q", config.FilterEmailAddress)
	}
}

func TestFetchEmailSyncConfigWithAnUnreadableValue(t *testing.T) {
	app := testutil.NewApp(t)
	storeConfig(t, app, "email_sync_config", `not json`)

	if _, err := settings.FetchEmailSyncConfig(app); err == nil {
		t.Error("expected an error, got none")
	}
}
