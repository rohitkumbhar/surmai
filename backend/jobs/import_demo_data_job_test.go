package jobs_test

import (
	"backend/jobs"
	"backend/testutil"
	"testing"
)

func TestImportDemoDataReplacesEverything(t *testing.T) {
	app := testutil.NewApp(t)

	// data from a previous run of the demo instance
	previous := testutil.CreateUser(t, app, "previous@example.com")
	oldTrip := testutil.CreateTrip(t, app, previous, map[string]any{"name": "Yesterday's demo"})
	oldProfile := testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"email": "someone@example.com", "legalName": "Someone", "ownerId": previous.Id,
	})

	job := &jobs.ImportDemoDataJob{
		App:          app,
		AdminEmail:   testutil.AdminEmail,
		DemoEmail:    "demo@surmai.app",
		DemoPassword: "demo-password-123",
		DemoTripPath: "../datasets/demo_trip.zip",
	}
	job.Execute()

	// the previous run's data is gone
	if _, err := app.FindRecordById("trips", oldTrip.Id); err == nil {
		t.Error("the previous trip was kept")
	}
	if _, err := app.FindRecordById("traveller_profiles", oldProfile.Id); err == nil {
		t.Error("the previous traveller profile was kept")
	}
	if _, err := app.FindRecordById("users", previous.Id); err == nil {
		t.Error("the previous user was kept")
	}

	// a fresh demo user exists and can sign in
	demoUser, err := app.FindAuthRecordByEmail("users", "demo@surmai.app")
	if err != nil {
		t.Fatalf("the demo user was not created: %v", err)
	}
	if !demoUser.ValidatePassword("demo-password-123") {
		t.Error("the demo user cannot sign in with the configured password")
	}

	// and the demo trip was imported for them
	trips, err := app.FindAllRecords("trips")
	if err != nil {
		t.Fatal(err)
	}
	if len(trips) == 0 {
		t.Fatal("the demo trip was not imported")
	}
	for _, trip := range trips {
		if got := trip.GetString("ownerId"); got != demoUser.Id {
			t.Errorf("trip %s is owned by %q, want the demo user", trip.Id, got)
		}
	}
}

// The job runs from the cron, so a missing archive must be logged and skipped
// rather than panicking the goroutine and taking the process down.
func TestImportDemoDataWithoutTheArchive(t *testing.T) {
	app := testutil.NewApp(t)

	job := &jobs.ImportDemoDataJob{
		App:          app,
		AdminEmail:   testutil.AdminEmail,
		DemoEmail:    "demo@surmai.app",
		DemoPassword: "demo-password-123",
		DemoTripPath: t.TempDir() + "/not-here.zip",
	}
	job.Execute() // must not panic

	// the demo user is still set up, just without a trip
	if _, err := app.FindAuthRecordByEmail("users", "demo@surmai.app"); err != nil {
		t.Errorf("the demo user was not created: %v", err)
	}
	count, _ := app.CountRecords("trips")
	if count != 0 {
		t.Errorf("imported %d trips, want none", count)
	}
}

// The admin account has to survive, otherwise the demo instance locks itself out.
func TestImportDemoDataKeepsTheAdminUser(t *testing.T) {
	app := testutil.NewApp(t)

	// the migrations create this account from SURMAI_ADMIN_EMAIL
	admin, err := app.FindAuthRecordByEmail("users", testutil.AdminEmail)
	if err != nil {
		t.Fatalf("the admin user is missing: %v", err)
	}

	job := &jobs.ImportDemoDataJob{
		App:          app,
		AdminEmail:   testutil.AdminEmail,
		DemoEmail:    "demo@surmai.app",
		DemoPassword: "demo-password-123",
		DemoTripPath: "../datasets/demo_trip.zip",
	}
	job.Execute()

	if _, err := app.FindRecordById("users", admin.Id); err != nil {
		t.Errorf("the admin user was deleted: %v", err)
	}
}
