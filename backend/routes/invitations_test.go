package routes_test

import (
	"backend/testutil"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
)

func TestCreateInvitedUser(t *testing.T) {
	app := testutil.NewApp(t)
	inviter := testutil.CreateUser(t, app, "inviter@example.com")
	invitation := testutil.CreateRecord(t, app, "account_invitations", map[string]any{
		"recipientEmail": "newcomer@example.com",
		"fromId":         inviter.Id,
		"invitationCode": "code-1234",
		"message":        "Join us",
	})

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/surmai/create-user",
		`{"invitationCode":"code-1234","email":"newcomer@example.com","name":"Newcomer","password":"a-long-password"}`, nil)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	created, err := app.FindAuthRecordByEmail("users", "newcomer@example.com")
	if err != nil {
		t.Fatalf("the invited user was not created: %v", err)
	}
	if got := created.GetString("name"); got != "Newcomer" {
		t.Errorf("name = %q, want Newcomer", got)
	}
	if !created.ValidatePassword("a-long-password") {
		t.Error("the new user cannot sign in with the password they chose")
	}

	// the invitation is single use
	if _, err := app.FindRecordById("account_invitations", invitation.Id); err == nil {
		t.Error("the invitation should have been deleted")
	}
}

func TestCreateInvitedUserRejectsBadInvitations(t *testing.T) {
	cases := map[string]string{
		"wrong code":           `{"invitationCode":"wrong","email":"newcomer@example.com","name":"N","password":"a-long-password"}`,
		"email does not match": `{"invitationCode":"code-1234","email":"someone@example.com","name":"N","password":"a-long-password"}`,
		"no invitation at all": `{"invitationCode":"","email":"nobody@example.com","name":"N","password":"a-long-password"}`,
	}

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			inviter := testutil.CreateUser(t, app, "inviter@example.com")
			testutil.CreateRecord(t, app, "account_invitations", map[string]any{
				"recipientEmail": "newcomer@example.com",
				"fromId":         inviter.Id,
				"invitationCode": "code-1234",
				"message":        "Join us",
			})

			before, err := app.CountRecords("users")
			if err != nil {
				t.Fatal(err)
			}

			client := testutil.NewClient(t, app)
			recorder := client.Request(http.MethodPost, "/api/surmai/create-user", body, nil)

			if recorder.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400: %s", recorder.Code, testutil.Body(t, recorder))
			}
			after, _ := app.CountRecords("users")
			if after != before {
				t.Errorf("the user count went from %d to %d, want no new account", before, after)
			}
		})
	}
}

// The endpoint is public, so a body that does not match the expected shape
// must come back as an error rather than panicking the handler.
func TestCreateInvitedUserRejectsMalformedBodies(t *testing.T) {
	cases := map[string]string{
		"no fields":             `{}`,
		"code is a number":      `{"invitationCode":123,"email":"a@example.com","name":"N","password":"p"}`,
		"email is null":         `{"invitationCode":"code-1234","email":null,"name":"N","password":"p"}`,
		"name is an object":     `{"invitationCode":"code-1234","email":"a@example.com","name":{},"password":"p"}`,
		"password is a bool":    `{"invitationCode":"code-1234","email":"a@example.com","name":"N","password":true}`,
		"body is not an object": `"just a string"`,
	}

	app := testutil.NewApp(t)
	client := testutil.NewClient(t, app)

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodPost, "/api/surmai/create-user", body, nil)
			if recorder.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400: %s", recorder.Code, testutil.Body(t, recorder))
			}
		})
	}
}

func TestCreateAccountInvitation(t *testing.T) {
	app := testutil.NewApp(t)
	superuser := testutil.Superuser(t, app)

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/surmai/settings/invite-user",
		`{"email":"newcomer@example.com","message":"Welcome aboard"}`, superuser)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	invitation, err := app.FindFirstRecordByData("account_invitations", "recipientEmail", "newcomer@example.com")
	if err != nil {
		t.Fatalf("no invitation was stored: %v", err)
	}
	if got := invitation.GetString("invitationCode"); got == "" {
		t.Error("the invitation has no code")
	}
	if got := invitation.GetString("message"); got != "Welcome aboard" {
		t.Errorf("message = %q", got)
	}

	// the invited address is emailed the code
	if len(app.TestMailer.Messages()) != 1 {
		t.Fatalf("sent %d emails, want 1", len(app.TestMailer.Messages()))
	}
	sent := app.TestMailer.LastMessage()
	if len(sent.To) != 1 || sent.To[0].Address != "newcomer@example.com" {
		t.Errorf("email recipients = %v", sent.To)
	}
	if code := invitation.GetString("invitationCode"); !strings.Contains(sent.HTML, code) {
		t.Errorf("the email does not carry the invitation code %q", code)
	}
}

func TestCreateAccountInvitationIsSuperuserOnly(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")
	client := testutil.NewClient(t, app)
	body := `{"email":"newcomer@example.com","message":"hi"}`

	for name, actor := range map[string]*core.Record{"a regular user": user, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodPost, "/api/surmai/settings/invite-user", body, actor)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
			count, _ := app.CountRecords("account_invitations")
			if count != 0 {
				t.Errorf("stored %d invitations, want none", count)
			}
		})
	}
}
