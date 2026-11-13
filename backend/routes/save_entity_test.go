package routes_test

import (
	"backend/testutil"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// saveEntity posts a payload to one of the save-entity routes.
func saveEntity(t testing.TB, app *tests.TestApp, kind string, trip, user *core.Record, payload map[string]any, files map[string]testutil.MultipartFile) *core.Record {
	t.Helper()

	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}

	client := testutil.NewClient(t, app)
	recorder := client.RequestMultipart(http.MethodPost, "/api/surmai/trip/"+trip.Id+"/save-"+kind,
		testutil.Multipart{Values: map[string]string{"payload": string(encoded)}, Files: files}, user)

	if recorder.Code != http.StatusOK {
		t.Fatalf("save-%s returned %d: %s", kind, recorder.Code, testutil.Body(t, recorder))
	}

	var saved struct {
		Id string `json:"id"`
	}
	if err := json.Unmarshal([]byte(testutil.Body(t, recorder)), &saved); err != nil {
		t.Fatal(err)
	}

	collection := map[string]string{"transportation": "transportations", "lodging": "lodgings", "activity": "activities"}[kind]
	record, err := app.FindRecordById(collection, saved.Id)
	if err != nil {
		t.Fatal(err)
	}
	return record
}

func flightData() map[string]any {
	return map[string]any{
		"type":          "flight",
		"origin":        "JFK",
		"destination":   "CDG",
		"departureTime": "2026-06-01 10:00:00.000Z",
		"arrivalTime":   "2026-06-01 22:00:00.000Z",
	}
}

func TestSaveEntityCreatesEachKind(t *testing.T) {
	cases := map[string]map[string]any{
		"transportation": flightData(),
		"lodging": {
			"type": "hotel", "name": "Hotel Paris", "address": "1 Rue de Rivoli",
			"startDate": "2026-06-01 15:00:00.000Z", "endDate": "2026-06-05 11:00:00.000Z",
		},
		"activity": {
			"name": "Louvre", "address": "Rue de Rivoli",
			"startDate": "2026-06-02 09:00:00.000Z",
		},
	}

	for kind, data := range cases {
		t.Run(kind, func(t *testing.T) {
			app := testutil.NewApp(t)
			owner := testutil.CreateUser(t, app, "owner@example.com")
			trip := testutil.CreateTrip(t, app, owner, nil)

			record := saveEntity(t, app, kind, trip, owner, map[string]any{"entityData": data}, nil)

			if got := record.GetString("trip"); got != trip.Id {
				t.Errorf("trip = %q, want %q", got, trip.Id)
			}
			for field, want := range data {
				if got := record.GetString(field); got != want {
					t.Errorf("%s = %q, want %q", field, got, want)
				}
			}
		})
	}
}

func TestSaveEntityCreatesAnExpense(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	record := saveEntity(t, app, "transportation", trip, owner, map[string]any{
		"entityData": flightData(),
		"expense": map[string]any{
			"name":       "Flight to Paris",
			"cost":       map[string]any{"value": 420.0, "currency": "EUR"},
			"occurredOn": "2026-06-01 00:00:00.000Z",
			"category":   "transportation",
		},
	}, nil)

	expenseId := record.GetString("expenseId")
	if expenseId == "" {
		t.Fatal("the saved record has no expense linked")
	}
	expense, err := app.FindRecordById("trip_expenses", expenseId)
	if err != nil {
		t.Fatal(err)
	}
	if got := expense.GetString("name"); got != "Flight to Paris" {
		t.Errorf("expense name = %q", got)
	}
	if got := expense.GetString("trip"); got != trip.Id {
		t.Errorf("expense trip = %q, want %q", got, trip.Id)
	}
}

// An expense is only created when there is an amount to record.
func TestSaveEntitySkipsAnExpenseWithoutACost(t *testing.T) {
	for name, expense := range map[string]any{
		"no expense at all": nil,
		"zero cost":         map[string]any{"name": "Free", "cost": map[string]any{"value": 0.0, "currency": "EUR"}},
		"no cost field":     map[string]any{"name": "Unknown"},
	} {
		t.Run(name, func(t *testing.T) {
			app := testutil.NewApp(t)
			owner := testutil.CreateUser(t, app, "owner@example.com")
			trip := testutil.CreateTrip(t, app, owner, nil)

			payload := map[string]any{"entityData": flightData()}
			if expense != nil {
				payload["expense"] = expense
			}
			record := saveEntity(t, app, "transportation", trip, owner, payload, nil)

			if got := record.GetString("expenseId"); got != "" {
				t.Errorf("expenseId = %q, want none", got)
			}
			count, _ := app.CountRecords("trip_expenses")
			if count != 0 {
				t.Errorf("created %d expenses, want none", count)
			}
		})
	}
}

// Clearing the cost on an entry removes the expense it created.
func TestSaveEntityDeletesTheExpenseWhenTheCostIsCleared(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	created := saveEntity(t, app, "transportation", trip, owner, map[string]any{
		"entityData": flightData(),
		"expense":    map[string]any{"name": "Flight", "cost": map[string]any{"value": 420.0, "currency": "EUR"}},
	}, nil)
	expenseId := created.GetString("expenseId")

	updated := saveEntity(t, app, "transportation", trip, owner, map[string]any{
		"entityId":          created.Id,
		"entityData":        flightData(),
		"existingExpenseId": expenseId,
	}, nil)

	if got := updated.GetString("expenseId"); got != "" {
		t.Errorf("expenseId = %q, want it cleared", got)
	}
	if _, err := app.FindRecordById("trip_expenses", expenseId); err == nil {
		t.Error("the expense should have been deleted")
	}
}

func TestSaveEntityUpdatesInPlace(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	created := saveEntity(t, app, "transportation", trip, owner, map[string]any{"entityData": flightData()}, nil)

	data := flightData()
	data["origin"] = "EWR"
	updated := saveEntity(t, app, "transportation", trip, owner, map[string]any{
		"entityId":   created.Id,
		"entityData": data,
	}, nil)

	if updated.Id != created.Id {
		t.Errorf("a new record was created (%s) instead of updating %s", updated.Id, created.Id)
	}
	if got := updated.GetString("origin"); got != "EWR" {
		t.Errorf("origin = %q, want EWR", got)
	}
	count, _ := app.CountRecords("transportations")
	if count != 1 {
		t.Errorf("there are %d transportations, want 1", count)
	}
}

func TestSaveEntityStoresUploadedAttachments(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	record := saveEntity(t, app, "transportation", trip, owner,
		map[string]any{"entityData": flightData()},
		map[string]testutil.MultipartFile{
			"attachments": {Name: "boarding-pass.txt", Content: []byte("seat 14C")},
		})

	references := record.GetStringSlice("attachmentReferences")
	if len(references) != 1 {
		t.Fatalf("attachmentReferences = %v, want one", references)
	}

	attachment, err := app.FindRecordById("trip_attachments", references[0])
	if err != nil {
		t.Fatal(err)
	}
	if got := attachment.GetString("trip"); got != trip.Id {
		t.Errorf("attachment trip = %q, want %q", got, trip.Id)
	}
	if got := attachment.GetString("name"); got != "boarding-pass.txt" {
		t.Errorf("attachment name = %q", got)
	}
}

func TestSaveEntityRejectsBadRequests(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)
	client := testutil.NewClient(t, app)
	url := "/api/surmai/trip/" + trip.Id + "/save-transportation"

	cases := map[string]testutil.Multipart{
		"no payload field":    {Values: map[string]string{"other": "x"}},
		"empty payload":       {Values: map[string]string{"payload": ""}},
		"payload is not json": {Values: map[string]string{"payload": "not json"}},
		"unknown entity id":   {Values: map[string]string{"payload": `{"entityId":"doesnotexist00","entityData":{}}`}},
	}

	for name, form := range cases {
		t.Run(name, func(t *testing.T) {
			recorder := client.RequestMultipart(http.MethodPost, url, form, owner)
			if recorder.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400: %s", recorder.Code, testutil.Body(t, recorder))
			}
		})
	}
}

func TestSaveEntityRequiresTripAccess(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	stranger := testutil.CreateUser(t, app, "stranger@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	client := testutil.NewClient(t, app)
	payload := `{"entityData":{"type":"flight","origin":"JFK","destination":"CDG","departureTime":"2026-06-01 10:00:00.000Z","arrivalTime":"2026-06-01 22:00:00.000Z"}}`
	form := testutil.Multipart{Values: map[string]string{"payload": payload}}

	for name, user := range map[string]*core.Record{"a stranger": stranger, "anonymous": nil} {
		t.Run(name, func(t *testing.T) {
			recorder := client.RequestMultipart(http.MethodPost, "/api/surmai/trip/"+trip.Id+"/save-transportation", form, user)
			if recorder.Code == http.StatusOK {
				t.Errorf("status = %d, want the request to be refused", recorder.Code)
			}
			count, _ := app.CountRecords("transportations")
			if count != 0 {
				t.Errorf("created %d transportations, want none", count)
			}
		})
	}
}

// entityId, existingExpenseId and existingAttachmentIds come from the request,
// so the handler has to check they belong to the trip being saved. Otherwise a
// user could move another trip's records into their own.
func TestSaveEntityRejectsRecordsFromAnotherTrip(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	attacker := testutil.CreateUser(t, app, "attacker@example.com")

	victimTrip := testutil.CreateTrip(t, app, owner, map[string]any{"name": "Private trip"})
	victimEntity := testutil.CreateRecord(t, app, "transportations", map[string]any{
		"type": "flight", "origin": "JFK", "destination": "CDG",
		"departureTime": "2026-06-01 10:00:00.000Z",
		"arrivalTime":   "2026-06-01 22:00:00.000Z",
		"trip":          victimTrip.Id,
	})
	victimExpense := testutil.CreateRecord(t, app, "trip_expenses", map[string]any{
		"name": "Private expense", "trip": victimTrip.Id,
	})
	victimAttachment := testutil.CreateRecord(t, app, "trip_attachments", map[string]any{
		"name": "private.pdf", "trip": victimTrip.Id,
	})

	attackerTrip := testutil.CreateTrip(t, app, attacker, map[string]any{"name": "Attacker trip"})
	client := testutil.NewClient(t, app)
	url := "/api/surmai/trip/" + attackerTrip.Id + "/save-transportation"

	t.Run("entity from another trip", func(t *testing.T) {
		payload, _ := json.Marshal(map[string]any{"entityId": victimEntity.Id, "entityData": flightData()})
		recorder := client.RequestMultipart(http.MethodPost, url,
			testutil.Multipart{Values: map[string]string{"payload": string(payload)}}, attacker)

		if recorder.Code == http.StatusOK {
			t.Errorf("status = %d, want the request to be refused", recorder.Code)
		}
		reloaded, err := app.FindRecordById("transportations", victimEntity.Id)
		if err != nil {
			t.Fatal(err)
		}
		if got := reloaded.GetString("trip"); got != victimTrip.Id {
			t.Errorf("the record moved to trip %q, want it left on %q", got, victimTrip.Id)
		}
	})

	t.Run("expense from another trip", func(t *testing.T) {
		payload, _ := json.Marshal(map[string]any{
			"entityData":        flightData(),
			"existingExpenseId": victimExpense.Id,
			"expense":           map[string]any{"name": "Taken", "cost": map[string]any{"value": 10.0, "currency": "EUR"}},
		})
		recorder := client.RequestMultipart(http.MethodPost, url,
			testutil.Multipart{Values: map[string]string{"payload": string(payload)}}, attacker)

		if recorder.Code == http.StatusOK {
			t.Errorf("status = %d, want the request to be refused", recorder.Code)
		}
		reloaded, err := app.FindRecordById("trip_expenses", victimExpense.Id)
		if err != nil {
			t.Fatal(err)
		}
		if got := reloaded.GetString("name"); got != "Private expense" {
			t.Errorf("the expense was overwritten with %q", got)
		}
	})

	t.Run("attachment from another trip", func(t *testing.T) {
		payload, _ := json.Marshal(map[string]any{
			"entityData":            flightData(),
			"existingAttachmentIds": []string{victimAttachment.Id},
		})
		recorder := client.RequestMultipart(http.MethodPost, url,
			testutil.Multipart{Values: map[string]string{"payload": string(payload)}}, attacker)

		if recorder.Code == http.StatusOK {
			t.Errorf("status = %d, want the request to be refused", recorder.Code)
		}
	})
}
