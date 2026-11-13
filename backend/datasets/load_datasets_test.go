package datasets_test

import (
	"backend/datasets"
	"backend/testutil"
	"testing"
)

func TestMain(m *testing.M) { testutil.Main(m) }

// The dataset files sit next to this package's source.
func useBundledFiles(t testing.TB) {
	t.Helper()

	previous := datasets.Dir
	datasets.Dir = "."
	t.Cleanup(func() { datasets.Dir = previous })
}

func TestLoadAirlinesDataset(t *testing.T) {
	useBundledFiles(t)
	app := testutil.NewApp(t)

	count, err := datasets.LoadAirlinesDataset(app)
	if err != nil {
		t.Fatal(err)
	}
	if count == 0 {
		t.Fatal("no airlines were loaded")
	}

	stored, err := app.CountRecords("airlines")
	if err != nil {
		t.Fatal(err)
	}
	if int(stored) != count {
		t.Errorf("reported %d airlines but stored %d", count, stored)
	}

	sample, err := app.FindFirstRecordByData("airlines", "code", "AA")
	if err != nil {
		t.Fatalf("American Airlines is missing from the dataset: %v", err)
	}
	if sample.GetString("name") == "" {
		t.Error("the loaded airline has no name")
	}
}

func TestLoadAirportsDataset(t *testing.T) {
	useBundledFiles(t)
	app := testutil.NewApp(t)

	count, err := datasets.LoadAirportsDataset(app, testutil.TimezoneFinder())
	if err != nil {
		t.Fatal(err)
	}
	if count == 0 {
		t.Fatal("no airports were loaded")
	}

	jfk, err := app.FindFirstRecordByData("airports", "iataCode", "JFK")
	if err != nil {
		t.Fatalf("JFK is missing from the dataset: %v", err)
	}
	// the loader fills the time zone in from the coordinates
	if got := jfk.GetString("timezone"); got != "America/New_York" {
		t.Errorf("JFK timezone = %q, want America/New_York", got)
	}
}

// Loading is idempotent: running it twice must not duplicate rows.
func TestLoadingADatasetTwice(t *testing.T) {
	useBundledFiles(t)
	app := testutil.NewApp(t)

	if _, err := datasets.LoadAirlinesDataset(app); err != nil {
		t.Fatal(err)
	}
	first, err := app.CountRecords("airlines")
	if err != nil {
		t.Fatal(err)
	}

	if _, err := datasets.LoadAirlinesDataset(app); err != nil {
		t.Fatal(err)
	}
	second, _ := app.CountRecords("airlines")

	if second != first {
		t.Errorf("airlines went from %d to %d, want loading to be idempotent", first, second)
	}
}

// A dataset file that is missing or unreadable must be reported, not fatal.
// These run from a superuser request, so exiting would take the server down.
func TestLoadingDatasetsWithoutTheFiles(t *testing.T) {
	previous := datasets.Dir
	datasets.Dir = t.TempDir() // empty
	t.Cleanup(func() { datasets.Dir = previous })

	app := testutil.NewApp(t)

	if _, err := datasets.LoadAirlinesDataset(app); err == nil {
		t.Error("expected an error for the missing airlines file")
	}
	if _, err := datasets.LoadAirportsDataset(app, testutil.TimezoneFinder()); err == nil {
		t.Error("expected an error for the missing airports file")
	}
	if _, err := datasets.LoadPlacesDataset(app, testutil.TimezoneFinder()); err == nil {
		t.Error("expected an error for the missing places file")
	}
}
