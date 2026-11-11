package hooks_test

import (
	"backend/testutil"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

func notificationsFor(t testing.TB, app *tests.TestApp, userId string) []*core.Record {
	t.Helper()

	records, err := app.FindRecordsByFilter("notifications", "userId = {:user}", "created", 0, 0,
		map[string]any{"user": userId})
	if err != nil {
		t.Fatal(err)
	}
	return records
}

// A trip owner can add a traveller by email before that person has an account.
// When they sign up they take over the profile and the creator stays a manager.
func TestSigningUpTakesOverAMatchingTravellerProfile(t *testing.T) {
	app := testutil.NewApp(t)
	creator := testutil.CreateUser(t, app, "creator@example.com")
	profile := testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"email":     "newcomer@example.com",
		"legalName": "New Comer",
		"ownerId":   creator.Id,
	})

	newcomer := testutil.CreateUser(t, app, "newcomer@example.com")

	reloaded, err := app.FindRecordById("traveller_profiles", profile.Id)
	if err != nil {
		t.Fatal(err)
	}
	if got := reloaded.GetString("ownerId"); got != newcomer.Id {
		t.Errorf("ownerId = %q, want the new user %q", got, newcomer.Id)
	}
	managers := reloaded.GetStringSlice("managers")
	if len(managers) != 1 || managers[0] != creator.Id {
		t.Errorf("managers = %v, want the previous owner [%s]", managers, creator.Id)
	}
}

func TestSigningUpWithoutAMatchingProfile(t *testing.T) {
	app := testutil.NewApp(t)
	before, err := app.CountRecords("traveller_profiles")
	if err != nil {
		t.Fatal(err)
	}

	testutil.CreateUser(t, app, "newcomer@example.com")

	after, _ := app.CountRecords("traveller_profiles")
	if after != before {
		t.Errorf("traveller profiles went from %d to %d, want no profile created", before, after)
	}
}

// Signing up with an address that already owns its profile must not add the
// new user as their own manager.
func TestSigningUpWhenTheProfileIsAlreadyOwned(t *testing.T) {
	app := testutil.NewApp(t)
	existing := testutil.CreateUser(t, app, "owner@example.com")
	profile := testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"email":     "owner@example.com",
		"legalName": "Owner",
		"ownerId":   existing.Id,
	})

	reloaded, err := app.FindRecordById("traveller_profiles", profile.Id)
	if err != nil {
		t.Fatal(err)
	}
	if managers := reloaded.GetStringSlice("managers"); len(managers) != 0 {
		t.Errorf("managers = %v, want none", managers)
	}
}

func TestNewUsersGetTheStandingAnnouncements(t *testing.T) {
	app := testutil.NewApp(t)

	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Welcome", "text": "Have a look around", "sender": "Surmai",
	})
	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Still current", "expiry": testutil.Ahead(24 * time.Hour),
	})
	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Long gone", "expiry": testutil.Ago(24 * time.Hour),
	})

	newcomer := testutil.CreateUser(t, app, "newcomer@example.com")

	subjects := map[string]bool{}
	for _, notification := range notificationsFor(t, app, newcomer.Id) {
		subjects[notification.GetString("subject")] = true
	}

	if !subjects["Welcome"] || !subjects["Still current"] {
		t.Errorf("notifications = %v, want the current announcements", subjects)
	}
	if subjects["Long gone"] {
		t.Error("an expired announcement was sent to the new user")
	}
}

func TestNewUsersStartWithUnreadNotifications(t *testing.T) {
	app := testutil.NewApp(t)
	testutil.CreateRecord(t, app, "announcements", map[string]any{"subject": "Welcome"})

	newcomer := testutil.CreateUser(t, app, "newcomer@example.com")

	notifications := notificationsFor(t, app, newcomer.Id)
	if len(notifications) != 1 {
		t.Fatalf("got %d notifications, want 1", len(notifications))
	}
	if notifications[0].GetBool("read") {
		t.Error("the notification should start unread")
	}
}

func TestAnnouncementsNotifyEveryExistingUser(t *testing.T) {
	app := testutil.NewApp(t)
	first := testutil.CreateUser(t, app, "first@example.com")
	second := testutil.CreateUser(t, app, "second@example.com")

	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Scheduled maintenance",
		"text":    "Back in an hour",
		"sender":  "Surmai",
	})

	for _, user := range []*core.Record{first, second} {
		notifications := notificationsFor(t, app, user.Id)
		if len(notifications) != 1 {
			t.Errorf("user %s got %d notifications, want 1", user.Email(), len(notifications))
			continue
		}
		if got := notifications[0].GetString("subject"); got != "Scheduled maintenance" {
			t.Errorf("subject = %q", got)
		}
		if got := notifications[0].GetString("text"); got != "Back in an hour" {
			t.Errorf("text = %q", got)
		}
	}
}

func TestAnnouncementExpiryIsCarriedToNotifications(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")
	expiry := testutil.Ahead(48 * time.Hour)

	testutil.CreateRecord(t, app, "announcements", map[string]any{
		"subject": "Temporary notice", "expiry": expiry,
	})

	notifications := notificationsFor(t, app, user.Id)
	if len(notifications) != 1 {
		t.Fatalf("got %d notifications, want 1", len(notifications))
	}
	if got := notifications[0].GetString("expiry"); got != expiry {
		t.Errorf("expiry = %q, want %q", got, expiry)
	}
}
