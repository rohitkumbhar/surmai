package trips_test

import (
	"archive/zip"
	"backend/testutil"
	"backend/trips"
	tripzip "backend/trips/import/zip"
	"bytes"
	"encoding/base64"
	"io"
	"os"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func TestMain(m *testing.M) { testutil.Main(m) }

const ticketBody = "ticket-pdf-bytes"

// a 1x1 PNG, since the image fields validate the mime type
var pngBytes = func() []byte {
	const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC"
	decoded, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		panic(err)
	}
	return decoded
}()

// exportArchive exports the trip as the given user and returns the archive for reading.
func exportArchive(t testing.TB, app core.App, trip *core.Record, user *core.Record) *zip.Reader {
	t.Helper()

	file, err := os.CreateTemp(t.TempDir(), "export-*.zip")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()

	if err := trips.ExportTripArchive(app, trip, file, &core.RequestInfo{Auth: user}); err != nil {
		t.Fatalf("export failed: %v", err)
	}

	content, err := os.ReadFile(file.Name())
	if err != nil {
		t.Fatal(err)
	}
	reader, err := zip.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		t.Fatalf("exported archive is not readable: %v", err)
	}
	return reader
}

// seedFullTrip creates a trip using every feature the archive carries.
func seedFullTrip(t testing.TB, app core.App, owner *core.Record) *core.Record {
	t.Helper()

	coverImage, err := filesystem.NewFileFromBytes(pngBytes, "cover.png")
	if err != nil {
		t.Fatal(err)
	}

	passport, err := filesystem.NewFileFromBytes(pngBytes, "passport.png")
	if err != nil {
		t.Fatal(err)
	}
	profile := testutil.CreateRecord(t, app, "traveller_profiles", map[string]any{
		"email":            "flyer@example.com",
		"legalName":        "Frequent Flyer",
		"passportId":       "X1234567",
		"ownerId":          owner.Id,
		"attachments":      []*filesystem.File{passport},
		"additionalFields": map[string]any{"seatPreference": "aisle"},
	})

	trip := testutil.CreateTrip(t, app, owner, map[string]any{
		"name":        "Round Trip",
		"description": "Everything at once",
		"notes":       "<p>Remember the adapter</p>",
		"coverImage":  coverImage,
		"budget":      map[string]any{"value": 2500.5, "currency": "EUR"},
		"travellers":  []string{profile.Id},
		"destinations": []map[string]any{
			{"id": "paris", "name": "Paris", "countryName": "France", "latitude": "48.8566", "longitude": "2.3522"},
		},
		"participants": []map[string]any{{"name": "Frequent Flyer"}},
	})

	ticket, err := filesystem.NewFileFromBytes([]byte(ticketBody), "ticket.pdf")
	if err != nil {
		t.Fatal(err)
	}
	attachment := testutil.CreateRecord(t, app, "trip_attachments", map[string]any{
		"name": "ticket.pdf",
		"trip": trip.Id,
		"file": ticket,
	})

	expense := testutil.CreateRecord(t, app, "trip_expenses", map[string]any{
		"name":                 "Flight to Paris",
		"trip":                 trip.Id,
		"cost":                 map[string]any{"value": 420.0, "currency": "EUR"},
		"occurredOn":           "2026-06-01 00:00:00.000Z",
		"category":             "transportation",
		"notes":                "Booked early",
		"attachmentReferences": []string{attachment.Id},
	})

	testutil.CreateRecord(t, app, "transportations", map[string]any{
		"type":                 "flight",
		"origin":               "JFK",
		"destination":          "CDG",
		"departureTime":        "2026-06-01 10:00:00.000Z",
		"arrivalTime":          "2026-06-01 22:00:00.000Z",
		"trip":                 trip.Id,
		"cost":                 map[string]any{"value": 420.0, "currency": "EUR"},
		"metadata":             map[string]any{"airline": "AF", "flightNumber": "AF007"},
		"link":                 "https://example.com/booking",
		"expenseId":            expense.Id,
		"attachmentReferences": []string{attachment.Id},
		"travellers":           []string{profile.Id},
	})

	testutil.CreateRecord(t, app, "lodgings", map[string]any{
		"type":             "hotel",
		"name":             "Hotel Paris",
		"address":          "1 Rue de Rivoli",
		"startDate":        "2026-06-01 15:00:00.000Z",
		"endDate":          "2026-06-05 11:00:00.000Z",
		"trip":             trip.Id,
		"confirmationCode": "ABC123",
		"cost":             map[string]any{"value": 800.0, "currency": "EUR"},
		"travellers":       []string{profile.Id},
	})

	testutil.CreateRecord(t, app, "activities", map[string]any{
		"name":        "Louvre",
		"description": "Guided tour",
		"address":     "Rue de Rivoli",
		"startDate":   "2026-06-02 09:00:00.000Z",
		"endDate":     "2026-06-02 12:00:00.000Z",
		"trip":        trip.Id,
		"travellers":  []string{profile.Id},
	})

	// reload so the travellers set above is visible on the record
	reloaded, err := app.FindRecordById("trips", trip.Id)
	if err != nil {
		t.Fatal(err)
	}
	return reloaded
}

func TestExportImportRoundTrip(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := seedFullTrip(t, app, owner)

	archive := exportArchive(t, app, trip, owner)

	// import as a different user, as happens when a shared archive is restored
	recipient := testutil.CreateUser(t, app, "recipient@example.com")
	newTripId, err := tripzip.ImportZip(app, archive, recipient.Id)
	if err != nil {
		t.Fatalf("import failed: %v", err)
	}
	if newTripId == trip.Id {
		t.Fatal("the imported trip reused the original id")
	}

	imported, err := app.FindRecordById("trips", newTripId)
	if err != nil {
		t.Fatal(err)
	}

	t.Run("trip fields", func(t *testing.T) {
		if got := imported.GetString("ownerId"); got != recipient.Id {
			t.Errorf("ownerId = %q, want the importing user %q", got, recipient.Id)
		}
		for field, want := range map[string]string{
			"name":        "Round Trip",
			"description": "Everything at once",
			"notes":       "<p>Remember the adapter</p>",
		} {
			if got := imported.GetString(field); got != want {
				t.Errorf("%s = %q, want %q", field, got, want)
			}
		}
		if got := imported.GetDateTime("startDate").String(); got != trip.GetDateTime("startDate").String() {
			t.Errorf("startDate = %q, want %q", got, trip.GetDateTime("startDate").String())
		}

		destinations := trips.Destinations(app, imported)
		if len(destinations) != 1 || destinations[0].Name != "Paris" {
			t.Errorf("destinations = %+v, want one entry for Paris", destinations)
		}
		participants := trips.Participants(app, imported)
		if len(participants) != 1 || participants[0].Name != "Frequent Flyer" {
			t.Errorf("participants = %+v, want one entry for Frequent Flyer", participants)
		}

		var budget struct {
			Value    float64 `json:"value"`
			Currency string  `json:"currency"`
		}
		if err := imported.UnmarshalJSONField("budget", &budget); err != nil {
			t.Fatal(err)
		}
		if budget.Value != 2500.5 || budget.Currency != "EUR" {
			t.Errorf("budget = %+v, want 2500.5 EUR", budget)
		}
	})

	t.Run("cover image", func(t *testing.T) {
		if name := imported.GetString("coverImage"); name == "" {
			t.Fatal("the imported trip has no cover image")
		}
		if got := readStoredFile(t, app, imported, imported.GetString("coverImage")); got != string(pngBytes) {
			t.Error("the imported cover image content does not match the original")
		}
	})

	t.Run("attachments", func(t *testing.T) {
		attachments := findByTrip(t, app, "trip_attachments", newTripId)
		if len(attachments) != 1 {
			t.Fatalf("got %d attachments, want 1", len(attachments))
		}
		if got := attachments[0].GetString("name"); got != "ticket.pdf" {
			t.Errorf("attachment name = %q, want ticket.pdf", got)
		}
		if got := readStoredFile(t, app, attachments[0], attachments[0].GetString("file")); got != ticketBody {
			t.Errorf("attachment content = %q, want %q", got, ticketBody)
		}
	})

	t.Run("relations point at the imported records", func(t *testing.T) {
		attachments := findByTrip(t, app, "trip_attachments", newTripId)
		expenses := findByTrip(t, app, "trip_expenses", newTripId)
		transportations := findByTrip(t, app, "transportations", newTripId)
		if len(expenses) != 1 || len(transportations) != 1 || len(attachments) != 1 {
			t.Fatalf("got %d expenses, %d transportations, %d attachments, want 1 of each",
				len(expenses), len(transportations), len(attachments))
		}

		if got := transportations[0].GetString("expenseId"); got != expenses[0].Id {
			t.Errorf("transportation expenseId = %q, want the imported expense %q", got, expenses[0].Id)
		}
		if got := transportations[0].GetStringSlice("attachmentReferences"); len(got) != 1 || got[0] != attachments[0].Id {
			t.Errorf("transportation attachmentReferences = %v, want [%s]", got, attachments[0].Id)
		}
		if got := expenses[0].GetStringSlice("attachmentReferences"); len(got) != 1 || got[0] != attachments[0].Id {
			t.Errorf("expense attachmentReferences = %v, want [%s]", got, attachments[0].Id)
		}
	})

	t.Run("traveller profiles", func(t *testing.T) {
		travellers := imported.GetStringSlice("travellers")
		if len(travellers) != 1 {
			t.Fatalf("imported trip travellers = %v, want one profile", travellers)
		}

		// profile emails are unique instance-wide, so the import links the
		// existing profile rather than making a second one for the same person
		original := trip.GetStringSlice("travellers")
		if travellers[0] != original[0] {
			t.Errorf("travellers = %v, want the existing profile %v", travellers, original)
		}

		profiles, err := app.FindAllRecords("traveller_profiles")
		if err != nil {
			t.Fatal(err)
		}
		if len(profiles) != 1 {
			t.Errorf("got %d traveller profiles, want 1 (no duplicate for the same email)", len(profiles))
		}

		for _, collection := range []string{"transportations", "lodgings", "activities"} {
			records := findByTrip(t, app, collection, newTripId)
			if len(records) != 1 {
				t.Fatalf("got %d %s, want 1", len(records), collection)
			}
			got := records[0].GetStringSlice("travellers")
			if len(got) != 1 || got[0] != travellers[0] {
				t.Errorf("%s travellers = %v, want [%s]", collection, got, travellers[0])
			}
		}
	})
}

// Moving an archive to another instance is the case where the traveller
// profile does not exist yet and has to be created from the archive.
func TestImportIntoAnotherInstance(t *testing.T) {
	source := testutil.NewApp(t)
	owner := testutil.CreateUser(t, source, "owner@example.com")
	trip := seedFullTrip(t, source, owner)
	archive := exportArchive(t, source, trip, owner)

	target := testutil.NewApp(t)
	recipient := testutil.CreateUser(t, target, "recipient@example.com")

	newTripId, err := tripzip.ImportZip(target, archive, recipient.Id)
	if err != nil {
		t.Fatalf("import failed: %v", err)
	}

	imported, err := target.FindRecordById("trips", newTripId)
	if err != nil {
		t.Fatal(err)
	}

	travellers := imported.GetStringSlice("travellers")
	if len(travellers) != 1 {
		t.Fatalf("travellers = %v, want one profile", travellers)
	}

	profile, err := target.FindRecordById("traveller_profiles", travellers[0])
	if err != nil {
		t.Fatal(err)
	}
	if got := profile.GetString("ownerId"); got != recipient.Id {
		t.Errorf("profile ownerId = %q, want the importing user %q", got, recipient.Id)
	}
	for field, want := range map[string]string{
		"email":      "flyer@example.com",
		"legalName":  "Frequent Flyer",
		"passportId": "X1234567",
	} {
		if got := profile.GetString(field); got != want {
			t.Errorf("profile %s = %q, want %q", field, got, want)
		}
	}
	if files := profile.GetStringSlice("attachments"); len(files) != 1 {
		t.Errorf("profile attachments = %v, want one file", files)
	} else if got := readStoredFile(t, target, profile, files[0]); got != string(pngBytes) {
		t.Error("the imported profile attachment content does not match the original")
	}

	// the records in the trip must point at the newly created profile
	for _, collection := range []string{"transportations", "lodgings", "activities"} {
		records := findByTrip(t, target, collection, newTripId)
		if len(records) != 1 {
			t.Fatalf("got %d %s, want 1", len(records), collection)
		}
		if got := records[0].GetStringSlice("travellers"); len(got) != 1 || got[0] != profile.Id {
			t.Errorf("%s travellers = %v, want [%s]", collection, got, profile.Id)
		}
	}
}

func TestExportEmptyTrip(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{"name": "Nothing planned"})

	archive := exportArchive(t, app, trip, owner)

	recipient := testutil.CreateUser(t, app, "recipient@example.com")
	newTripId, err := tripzip.ImportZip(app, archive, recipient.Id)
	if err != nil {
		t.Fatalf("importing an empty trip failed: %v", err)
	}

	imported, err := app.FindRecordById("trips", newTripId)
	if err != nil {
		t.Fatal(err)
	}
	if got := imported.GetString("name"); got != "Nothing planned" {
		t.Errorf("name = %q, want %q", got, "Nothing planned")
	}
	for _, collection := range []string{"transportations", "lodgings", "activities", "trip_expenses", "trip_attachments"} {
		if records := findByTrip(t, app, collection, newTripId); len(records) != 0 {
			t.Errorf("got %d %s, want none", len(records), collection)
		}
	}
}

// A json field holding an unexpected shape must not bring the process down.
// "participants" accepts any JSON, so a client can store a string there.
func TestExportTripWithMalformedJsonField(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, nil)

	trip.Set("participants", "")
	if err := app.Save(trip); err != nil {
		t.Fatal(err)
	}

	archive := exportArchive(t, app, trip, owner)

	recipient := testutil.CreateUser(t, app, "recipient@example.com")
	if _, err := tripzip.ImportZip(app, archive, recipient.Id); err != nil {
		t.Fatalf("import failed: %v", err)
	}
}

func TestExportSkipsTravellerProfilesTheUserCannotSee(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := seedFullTrip(t, app, owner)

	// a collaborator may export the trip but has no access to the owner's profiles
	collaborator := testutil.CreateUser(t, app, "collaborator@example.com")
	trip.Set("collaborators", []string{collaborator.Id})
	if err := app.Save(trip); err != nil {
		t.Fatal(err)
	}

	archive := exportArchive(t, app, trip, collaborator)
	newTripId, err := tripzip.ImportZip(app, archive, collaborator.Id)
	if err != nil {
		t.Fatal(err)
	}

	imported, err := app.FindRecordById("trips", newTripId)
	if err != nil {
		t.Fatal(err)
	}
	if travellers := imported.GetStringSlice("travellers"); len(travellers) != 0 {
		t.Errorf("travellers = %v, want none exported for a user without access", travellers)
	}
	if _, err := app.FindFirstRecordByData("traveller_profiles", "legalName", "Frequent Flyer"); err == nil {
		// the owner's own profile still exists, so look for a copy owned by the collaborator
		profiles, _ := app.FindAllRecords("traveller_profiles")
		if len(profiles) != 1 {
			t.Errorf("got %d traveller profiles, want only the owner's original", len(profiles))
		}
	}
}

func findByTrip(t testing.TB, app core.App, collection, tripId string) []*core.Record {
	t.Helper()

	records, err := app.FindRecordsByFilter(collection, "trip = {:trip}", "created", 0, 0, map[string]any{"trip": tripId})
	if err != nil {
		t.Fatalf("could not read %s: %v", collection, err)
	}
	return records
}

func readStoredFile(t testing.TB, app core.App, record *core.Record, fileName string) string {
	t.Helper()

	fsys, err := app.NewFilesystem()
	if err != nil {
		t.Fatal(err)
	}
	defer fsys.Close()

	file, err := fsys.GetReader(record.BaseFilesPath() + "/" + fileName)
	if err != nil {
		t.Fatalf("stored file %q is missing: %v", fileName, err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		t.Fatal(err)
	}
	return string(content)
}

// A user can upload any file to the import endpoint, so a zip that is not a
// trip archive has to come back as an error rather than a panic.
func TestImportRejectsArchiveWithoutTripJson(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	cases := map[string]map[string]string{
		"no trip.json":          {"notes.txt": "just some file"},
		"empty archive":         {},
		"trip.json not json":    {"trip.json": "this is not json"},
		"trip.json has no trip": {"trip.json": `{"transportations":[]}`},
	}

	for name, files := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := tripzip.ImportZip(app, buildArchive(t, files), user.Id); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

func buildArchive(t testing.TB, files map[string]string) *zip.Reader {
	t.Helper()

	var buf bytes.Buffer
	writer := zip.NewWriter(&buf)
	for name, content := range files {
		entry, err := writer.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := entry.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}

	reader, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatal(err)
	}
	return reader
}

// An entry can reference an expense that is not in the archive's expense list,
// for instance when an older export is restored. The importer then creates a
// placeholder so the link is not silently dropped.
func TestImportLinksAnExpenseMissingFromTheList(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	tripJson := `{
	  "trip": {"name": "Older export", "startDate": "2026-06-01 00:00:00.000Z", "endDate": "2026-06-05 00:00:00.000Z"},
	  "transportations": [{
	    "id": "t1", "type": "flight", "origin": "JFK", "destination": "CDG",
	    "departure": "2026-06-01 10:00:00.000Z", "arrival": "2026-06-01 22:00:00.000Z",
	    "expenseId": "gone"
	  }]
	}`

	newTripId, err := tripzip.ImportZip(app, buildArchive(t, map[string]string{"trip.json": tripJson}), user.Id)
	if err != nil {
		t.Fatalf("import failed: %v", err)
	}

	transportations := findByTrip(t, app, "transportations", newTripId)
	expenses := findByTrip(t, app, "trip_expenses", newTripId)
	if len(transportations) != 1 || len(expenses) != 1 {
		t.Fatalf("got %d transportations and %d expenses, want 1 of each", len(transportations), len(expenses))
	}
	if got := transportations[0].GetString("expenseId"); got != expenses[0].Id {
		t.Errorf("expenseId = %q, want the placeholder expense %q", got, expenses[0].Id)
	}
	if got := expenses[0].GetString("name"); got != "Imported Expense" {
		t.Errorf("placeholder expense name = %q, want %q", got, "Imported Expense")
	}
}

// An entry referencing an expense that is in the list must reuse it rather
// than creating a second copy.
func TestImportReusesAnExpenseSharedByTwoEntries(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	tripJson := `{
	  "trip": {"name": "Shared expense", "startDate": "2026-06-01 00:00:00.000Z", "endDate": "2026-06-05 00:00:00.000Z"},
	  "expenses": [{"id": "e1", "name": "Package deal"}],
	  "transportations": [{
	    "id": "t1", "type": "flight", "origin": "JFK", "destination": "CDG",
	    "departure": "2026-06-01 10:00:00.000Z", "arrival": "2026-06-01 22:00:00.000Z",
	    "expenseId": "e1"
	  }],
	  "lodgings": [{
	    "id": "l1", "type": "hotel", "name": "Hotel", "address": "a",
	    "startDate": "2026-06-01 15:00:00.000Z", "endDate": "2026-06-05 11:00:00.000Z",
	    "expenseId": "e1"
	  }]
	}`

	newTripId, err := tripzip.ImportZip(app, buildArchive(t, map[string]string{"trip.json": tripJson}), user.Id)
	if err != nil {
		t.Fatalf("import failed: %v", err)
	}

	expenses := findByTrip(t, app, "trip_expenses", newTripId)
	if len(expenses) != 1 {
		t.Fatalf("got %d expenses, want 1 shared between both entries", len(expenses))
	}
	for _, collection := range []string{"transportations", "lodgings"} {
		records := findByTrip(t, app, collection, newTripId)
		if len(records) != 1 {
			t.Fatalf("got %d %s, want 1", len(records), collection)
		}
		if got := records[0].GetString("expenseId"); got != expenses[0].Id {
			t.Errorf("%s expenseId = %q, want %q", collection, got, expenses[0].Id)
		}
	}
}
