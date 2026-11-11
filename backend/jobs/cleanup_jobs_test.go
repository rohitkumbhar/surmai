package jobs_test

import (
	"backend/jobs"
	"backend/testutil"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

func TestMain(m *testing.M) { testutil.Main(m) }

func ids(records []*core.Record) []string {
	out := make([]string, 0, len(records))
	for _, r := range records {
		out = append(out, r.Id)
	}
	return out
}

func remaining(t testing.TB, app *tests.TestApp, collection string) []string {
	t.Helper()

	records, err := app.FindAllRecords(collection)
	if err != nil {
		t.Fatal(err)
	}
	return ids(records)
}

func contains(items []string, want string) bool {
	for _, item := range items {
		if item == want {
			return true
		}
	}
	return false
}

func TestCleanupInvitationsMarksExpiredOnes(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	newInvitation := func(id, status, expiresOn string) *core.Record {
		return testutil.CreateRecord(t, app, "invitations", map[string]any{
			"id": id, "from": owner.Id, "trip": trip.Id,
			"recipientEmail": id + "@example.com",
			"status":         status, "expiresOn": expiresOn,
		})
	}

	stillOpen := newInvitation("invopen00000001", "open", testutil.Ahead(24*time.Hour))
	justExpired := newInvitation("invexpired00001", "open", testutil.Ago(time.Hour))
	longGone := newInvitation("involdopen00001", "open", testutil.Ago(10*24*time.Hour))
	accepted := newInvitation("invaccepted0001", "accepted", testutil.Ago(10*24*time.Hour))

	job := &jobs.CleanupInvitationsJob{App: app}
	job.Execute()

	left := remaining(t, app, "invitations")

	// past its expiry but still within the retention window: marked, not deleted
	if !contains(left, justExpired.Id) {
		t.Fatalf("the recently expired invitation was deleted, remaining: %v", left)
	}
	reloaded, err := app.FindRecordById("invitations", justExpired.Id)
	if err != nil {
		t.Fatal(err)
	}
	if got := reloaded.GetString("status"); got != "expired" {
		t.Errorf("status = %q, want expired", got)
	}

	// an invitation that has not expired is untouched
	if !contains(left, stillOpen.Id) {
		t.Errorf("the open invitation was removed, remaining: %v", left)
	}
	reloaded, err = app.FindRecordById("invitations", stillOpen.Id)
	if err != nil {
		t.Fatal(err)
	}
	if got := reloaded.GetString("status"); got != "open" {
		t.Errorf("status = %q, want it left open", got)
	}

	// more than a week past expiry: deleted
	for _, gone := range []*core.Record{longGone, accepted} {
		if contains(left, gone.Id) {
			t.Errorf("invitation %s should have been deleted, remaining: %v", gone.Id, left)
		}
	}
}

func TestCleanupExpiredContent(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	expiredAnnouncement := testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Old news", "expiry": testutil.Ago(time.Hour),
	})
	futureAnnouncement := testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Upcoming", "expiry": testutil.Ahead(24 * time.Hour),
	})
	expiredNotification := testutil.CreateRecord(t, app, "notifications", map[string]any{
		"userId": user.Id, "subject": "Old", "expiry": testutil.Ago(time.Hour),
	})
	futureNotification := testutil.CreateRecord(t, app, "notifications", map[string]any{
		"userId": user.Id, "subject": "Current", "expiry": testutil.Ahead(24 * time.Hour),
	})

	job := &jobs.CleanupExpiredContentJob{App: app}
	job.Execute()

	announcements := remaining(t, app, "announcements")
	if contains(announcements, expiredAnnouncement.Id) {
		t.Errorf("the expired announcement was kept, remaining: %v", announcements)
	}
	if !contains(announcements, futureAnnouncement.Id) {
		t.Errorf("the future announcement was deleted, remaining: %v", announcements)
	}

	notifications := remaining(t, app, "notifications")
	if contains(notifications, expiredNotification.Id) {
		t.Errorf("the expired notification was kept, remaining: %v", notifications)
	}
	if !contains(notifications, futureNotification.Id) {
		t.Errorf("the future notification was deleted, remaining: %v", notifications)
	}
}

// Announcements and notifications are not required to expire. An empty expiry
// must not be treated as "already expired".
func TestCleanupKeepsContentWithoutAnExpiry(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	announcement := testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "No expiry set",
	})
	notification := testutil.CreateRecord(t, app, "notifications", map[string]any{
		"userId": user.Id, "subject": "No expiry set",
	})

	job := &jobs.CleanupExpiredContentJob{App: app}
	job.Execute()

	if announcements := remaining(t, app, "announcements"); !contains(announcements, announcement.Id) {
		t.Errorf("an announcement without an expiry was deleted, remaining: %v", announcements)
	}
	if notifications := remaining(t, app, "notifications"); !contains(notifications, notification.Id) {
		t.Errorf("a notification without an expiry was deleted, remaining: %v", notifications)
	}
}
