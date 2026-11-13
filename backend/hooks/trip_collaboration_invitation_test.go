package hooks_test

import (
	"backend/testutil"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// inviteBody is what the UI sends: only the recipient, message and trip. The
// sender, status, expiry and metadata are filled in by the hook.
func inviteBody(email, tripId string) string {
	return fmt.Sprintf(`{"recipientEmail":%q,"message":"Join my trip","trip":%q}`, email, tripId)
}

func invitationFor(t testing.TB, app *tests.TestApp, email string) *core.Record {
	t.Helper()

	record, err := app.FindFirstRecordByData("invitations", "recipientEmail", email)
	if err != nil {
		t.Fatalf("no invitation for %s: %v", email, err)
	}
	return record
}

func TestCreateTripCollaborationInvitation(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	invitee := testutil.CreateUser(t, app, "invitee@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{"name": "Paris in June"})

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/collections/invitations/records",
		inviteBody("invitee@example.com", trip.Id), owner)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	invitation := invitationFor(t, app, "invitee@example.com")
	if got := invitation.GetString("from"); got != owner.Id {
		t.Errorf("from = %q, want the sender %q", got, owner.Id)
	}
	if got := invitation.GetString("status"); got != "open" {
		t.Errorf("status = %q, want open", got)
	}
	if invitation.GetDateTime("expiresOn").IsZero() {
		t.Error("expiresOn was not set")
	}
	// the cleanup job compares this against a types.DateTime, so it has to be
	// stored in the canonical format rather than Go's default time layout
	if raw := invitation.GetString("expiresOn"); !strings.HasSuffix(raw, "Z") || strings.Contains(raw, "+") {
		t.Errorf("expiresOn = %q, want the canonical stored format", raw)
	}

	// the metadata lets the recipient see what they were invited to without
	// being able to read the trip yet
	var metadata struct {
		Trip struct {
			Name      string `json:"name"`
			StartDate string `json:"startDate"`
		} `json:"trip"`
		Sender struct {
			Name string `json:"name"`
		} `json:"sender"`
	}
	if err := invitation.UnmarshalJSONField("metadata", &metadata); err != nil {
		t.Fatal(err)
	}
	if metadata.Trip.Name != "Paris in June" {
		t.Errorf("metadata trip name = %q, want Paris in June", metadata.Trip.Name)
	}
	if metadata.Trip.StartDate == "" {
		t.Error("metadata does not carry the trip dates")
	}
	if metadata.Sender.Name != owner.GetString("name") {
		t.Errorf("metadata sender = %q, want %q", metadata.Sender.Name, owner.GetString("name"))
	}

	if len(app.TestMailer.Messages()) != 1 {
		t.Fatalf("sent %d emails, want 1", len(app.TestMailer.Messages()))
	}
	sent := app.TestMailer.LastMessage()
	if len(sent.To) != 1 || sent.To[0].Address != invitee.Email() {
		t.Errorf("email went to %v, want the invitee", sent.To)
	}
}

func TestCreateTripCollaborationInvitationRequiresEditAccess(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	stranger := testutil.CreateUser(t, app, "stranger@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)

	for name, actor := range map[string]*core.Record{"a stranger": stranger, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodPost, "/api/collections/invitations/records",
				inviteBody("invitee@example.com", trip.Id), actor)

			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
			count, _ := app.CountRecords("invitations")
			if count != 0 {
				t.Errorf("stored %d invitations, want none", count)
			}
			if len(app.TestMailer.Messages()) != 0 {
				t.Errorf("sent %d emails, want none", len(app.TestMailer.Messages()))
			}
		})
	}
}

// Inviting the same person twice must not pile up invitations or emails.
func TestCreateTripCollaborationInvitationIgnoresDuplicates(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	testutil.CreateUser(t, app, "invitee@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	body := inviteBody("invitee@example.com", trip.Id)

	for i := 0; i < 2; i++ {
		if recorder := client.Request(http.MethodPost, "/api/collections/invitations/records", body, owner); recorder.Code != http.StatusOK {
			t.Fatalf("invitation %d returned %d: %s", i+1, recorder.Code, testutil.Body(t, recorder))
		}
	}

	count, _ := app.CountRecords("invitations")
	if count != 1 {
		t.Errorf("stored %d invitations, want 1", count)
	}
	if got := len(app.TestMailer.Messages()); got != 1 {
		t.Errorf("sent %d emails, want 1", got)
	}
}

func TestAcceptingAnInvitationAddsTheCollaborator(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	invitee := testutil.CreateUser(t, app, "invitee@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	if recorder := client.Request(http.MethodPost, "/api/collections/invitations/records",
		inviteBody("invitee@example.com", trip.Id), owner); recorder.Code != http.StatusOK {
		t.Fatalf("could not create the invitation: %s", testutil.Body(t, recorder))
	}
	invitation := invitationFor(t, app, "invitee@example.com")

	recorder := client.Request(http.MethodPatch, "/api/collections/invitations/records/"+invitation.Id,
		`{"status":"accepted"}`, invitee)
	if recorder.Code != http.StatusOK {
		t.Fatalf("accepting returned %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	reloaded, err := app.FindRecordById("trips", trip.Id)
	if err != nil {
		t.Fatal(err)
	}
	collaborators := reloaded.GetStringSlice("collaborators")
	if len(collaborators) != 1 || collaborators[0] != invitee.Id {
		t.Errorf("collaborators = %v, want [%s]", collaborators, invitee.Id)
	}
}

func TestRejectingAnInvitationLeavesTheTripAlone(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	invitee := testutil.CreateUser(t, app, "invitee@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	client.Request(http.MethodPost, "/api/collections/invitations/records", inviteBody("invitee@example.com", trip.Id), owner)
	invitation := invitationFor(t, app, "invitee@example.com")

	recorder := client.Request(http.MethodPatch, "/api/collections/invitations/records/"+invitation.Id,
		`{"status":"rejected"}`, invitee)
	if recorder.Code != http.StatusOK {
		t.Fatalf("rejecting returned %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	reloaded, _ := app.FindRecordById("trips", trip.Id)
	if collaborators := reloaded.GetStringSlice("collaborators"); len(collaborators) != 0 {
		t.Errorf("collaborators = %v, want none", collaborators)
	}
}

// Only the person an invitation was sent to may act on it.
func TestOnlyTheRecipientCanAnswerAnInvitation(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	testutil.CreateUser(t, app, "invitee@example.com")
	stranger := testutil.CreateUser(t, app, "stranger@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	client.Request(http.MethodPost, "/api/collections/invitations/records", inviteBody("invitee@example.com", trip.Id), owner)
	invitation := invitationFor(t, app, "invitee@example.com")

	for name, actor := range map[string]*core.Record{"the sender": owner, "a stranger": stranger, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodPatch, "/api/collections/invitations/records/"+invitation.Id,
				`{"status":"accepted"}`, actor)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}

			reloaded, _ := app.FindRecordById("trips", trip.Id)
			if collaborators := reloaded.GetStringSlice("collaborators"); len(collaborators) != 0 {
				t.Errorf("collaborators = %v, want none", collaborators)
			}
		})
	}
}
