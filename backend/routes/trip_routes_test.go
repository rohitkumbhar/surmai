package routes_test

import (
	"backend/testutil"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
)

func TestGetTripCollaborators(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	first := testutil.CreateUser(t, app, "first@example.com")
	second := testutil.CreateUser(t, app, "second@example.com")
	outsider := testutil.CreateUser(t, app, "outsider@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{
		"collaborators": []string{first.Id, second.Id},
	})

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodGet, "/api/surmai/trip/"+trip.Id+"/collaborators", "", owner)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}

	body := testutil.Body(t, recorder)
	for _, want := range []string{first.Id, second.Id} {
		if !strings.Contains(body, want) {
			t.Errorf("response is missing collaborator %s: %s", want, body)
		}
	}
	if strings.Contains(body, outsider.Id) {
		t.Errorf("response names a user who is not a collaborator: %s", body)
	}
}

func TestGetTripCollaboratorsForATripWithNone(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodGet, "/api/surmai/trip/"+trip.Id+"/collaborators", "", owner)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}
	if got := strings.TrimSpace(testutil.Body(t, recorder)); got != "[]" && got != "null" {
		t.Errorf("body = %q, want an empty list", got)
	}
}

func TestGetTripCollaboratorsRequiresAccess(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	stranger := testutil.CreateUser(t, app, "stranger@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	for name, actor := range map[string]*core.Record{"a stranger": stranger, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodGet, "/api/surmai/trip/"+trip.Id+"/collaborators", "", actor)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
		})
	}
}

func TestTripRoutesRejectAnUnknownTrip(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	client := testutil.NewClient(t, app)
	for _, path := range []string{"/collaborators", "/export", "/calendar"} {
		t.Run(path, func(t *testing.T) {
			method := http.MethodPost
			if path == "/collaborators" {
				method = http.MethodGet
			}
			recorder := client.Request(method, "/api/surmai/trip/doesnotexist00"+path, "", user)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
		})
	}
}

func TestExportTripReturnsAnArchive(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{"name": "Exported"})

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/surmai/trip/"+trip.Id+"/export", "", owner)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
	}
	// the archive comes back base64 encoded in a data field
	if !strings.Contains(testutil.Body(t, recorder), `"data":"`) {
		t.Errorf("response does not carry the archive: %s", testutil.Body(t, recorder))
	}
}

func TestImpersonateIsSuperuserOnly(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")
	superuser := testutil.Superuser(t, app)
	client := testutil.NewClient(t, app)

	t.Run("a superuser receives a token for the user", func(t *testing.T) {
		recorder := client.Request(http.MethodPost, "/impersonate", `{"email":"user@example.com"}`, superuser)
		if recorder.Code != http.StatusOK {
			t.Fatalf("status = %d: %s", recorder.Code, testutil.Body(t, recorder))
		}
		if body := testutil.Body(t, recorder); !strings.Contains(body, `"token":"`) {
			t.Errorf("response has no token: %s", body)
		}
	})

	t.Run("an unknown address is refused", func(t *testing.T) {
		recorder := client.Request(http.MethodPost, "/impersonate", `{"email":"nobody@example.com"}`, superuser)
		if recorder.Code != http.StatusUnauthorized {
			t.Errorf("status = %d, want 401", recorder.Code)
		}
	})

	for name, actor := range map[string]*core.Record{"a regular user": user, "anonymous": nil} {
		t.Run(name+" is refused", func(t *testing.T) {
			recorder := client.Request(http.MethodPost, "/impersonate", `{"email":"user@example.com"}`, actor)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
		})
	}
}

func TestLoadDatasetRejectsAnUnknownName(t *testing.T) {
	app := testutil.NewApp(t)
	superuser := testutil.Superuser(t, app)

	client := testutil.NewClient(t, app)
	recorder := client.Request(http.MethodPost, "/api/surmai/settings/datasets", `{"name":"not-a-dataset"}`, superuser)

	if recorder.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400: %s", recorder.Code, testutil.Body(t, recorder))
	}
}

func TestLoadDatasetIsSuperuserOnly(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	client := testutil.NewClient(t, app)
	for name, actor := range map[string]*core.Record{"a regular user": user, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.Request(http.MethodPost, "/api/surmai/settings/datasets", `{"name":"airlines"}`, actor)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
		})
	}
}
