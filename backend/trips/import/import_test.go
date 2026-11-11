package _import_test

import (
	"archive/zip"
	"backend/testutil"
	"backend/trips"
	tripimport "backend/trips/import"
	jsonimport "backend/trips/import/json"
	"bytes"
	"os"
	"testing"

	"github.com/pocketbase/pocketbase/core"
)

func TestMain(m *testing.M) { testutil.Main(m) }

// asMultipartFile writes the content to a temp file, which satisfies multipart.File.
func asMultipartFile(t testing.TB, content []byte) *os.File {
	t.Helper()

	file, err := os.CreateTemp(t.TempDir(), "upload-*")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { file.Close() })

	if _, err := file.Write(content); err != nil {
		t.Fatal(err)
	}
	if _, err := file.Seek(0, 0); err != nil {
		t.Fatal(err)
	}
	return file
}

func TestImportArchive(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{"name": "Uploaded trip"})

	export, err := os.CreateTemp(t.TempDir(), "export-*.zip")
	if err != nil {
		t.Fatal(err)
	}
	defer export.Close()
	if err := trips.ExportTripArchive(app, trip, export, &core.RequestInfo{Auth: owner}); err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(export.Name())
	if err != nil {
		t.Fatal(err)
	}

	recipient := testutil.CreateUser(t, app, "recipient@example.com")
	newTripId, err := tripimport.Import(app, asMultipartFile(t, content), recipient.Id)
	if err != nil {
		t.Fatalf("import failed: %v", err)
	}

	imported, err := app.FindRecordById("trips", newTripId)
	if err != nil {
		t.Fatal(err)
	}
	if got := imported.GetString("name"); got != "Uploaded trip" {
		t.Errorf("name = %q, want %q", got, "Uploaded trip")
	}
}

func TestImportRejectsFilesThatAreNotArchives(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	cases := map[string][]byte{
		"plain text": []byte("this is not a zip file"),
		"empty file": {},
		"truncated zip": func() []byte {
			var buf bytes.Buffer
			writer := zip.NewWriter(&buf)
			entry, _ := writer.Create("trip.json")
			_, _ = entry.Write([]byte(`{}`))
			_ = writer.Close()
			return buf.Bytes()[:10]
		}(),
	}

	for name, content := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := tripimport.Import(app, asMultipartFile(t, content), user.Id); err == nil {
				t.Error("expected an error, got none")
			}
		})
	}
}

// The JSON format predates the archive format and is no longer accepted.
func TestJsonImportIsUnsupported(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "user@example.com")

	if _, err := jsonimport.ImportJsonFile(app, []byte(`{"trip":{}}`), user.Id); err == nil {
		t.Error("expected the JSON importer to report that it is unsupported")
	}
}
