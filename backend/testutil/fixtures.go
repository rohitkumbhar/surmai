package testutil

import (
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

const DefaultPassword = "password-123456"

// CreateRecord saves a new record in the named collection with the given fields.
func CreateRecord(t testing.TB, app core.App, collection string, fields map[string]any) *core.Record {
	t.Helper()

	col, err := app.FindCollectionByNameOrId(collection)
	if err != nil {
		t.Fatalf("collection %q not found: %v", collection, err)
	}

	record := core.NewRecord(col)
	for key, value := range fields {
		record.Set(key, value)
	}

	if err := app.Save(record); err != nil {
		t.Fatalf("failed to save %s record: %v", collection, err)
	}

	return record
}

// CreateUser creates a regular user with DefaultPassword.
func CreateUser(t testing.TB, app core.App, email string) *core.Record {
	t.Helper()

	return CreateRecord(t, app, "users", map[string]any{
		"email":    email,
		"name":     email,
		"password": DefaultPassword,
		"verified": true,
	})
}

// CreateTrip creates a trip owned by owner. Extra fields override the defaults.
func CreateTrip(t testing.TB, app core.App, owner *core.Record, fields map[string]any) *core.Record {
	t.Helper()

	data := map[string]any{
		"name":         "Test Trip",
		"description":  "A trip created by a test",
		"startDate":    "2026-06-01 00:00:00.000Z",
		"endDate":      "2026-06-10 00:00:00.000Z",
		"ownerId":      owner.Id,
		"participants": []map[string]any{{"name": owner.GetString("name")}},
		"destinations": []map[string]any{},
	}
	for key, value := range fields {
		data[key] = value
	}

	return CreateRecord(t, app, "trips", data)
}

// AuthToken returns an auth token for the given user or superuser record.
func AuthToken(t testing.TB, record *core.Record) string {
	t.Helper()

	token, err := record.NewAuthToken()
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	return token
}

// AuthHeaders returns request headers authenticating as the given record.
// A nil record returns no headers, i.e. an anonymous request.
func AuthHeaders(t testing.TB, record *core.Record) map[string]string {
	t.Helper()

	if record == nil {
		return nil
	}
	return map[string]string{"Authorization": AuthToken(t, record)}
}

// Superuser returns the superuser created by the Surmai migrations.
func Superuser(t testing.TB, app core.App) *core.Record {
	t.Helper()

	record, err := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, AdminEmail)
	if err != nil {
		t.Fatalf("superuser not found: %v", err)
	}
	return record
}

// StoredTimeFormat is how PocketBase writes date fields.
const StoredTimeFormat = "2006-01-02 15:04:05.000Z"

// Ago returns a stored-format timestamp d before now.
func Ago(d time.Duration) string {
	return time.Now().Add(-d).UTC().Format(StoredTimeFormat)
}

// Ahead returns a stored-format timestamp d after now.
func Ahead(d time.Duration) string {
	return time.Now().Add(d).UTC().Format(StoredTimeFormat)
}
