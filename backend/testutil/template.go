package testutil

import (
	"os"
	"sync"
	"testing"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

var (
	templatesMu sync.Mutex
	templates   []*Template
)

// Template is a data directory that is migrated and seeded once, then cloned
// for every test app created from it. Cloning is much faster than running
// all migrations and seeding again for each test or ApiScenario.
type Template struct {
	seed func(t testing.TB, app core.App)

	once sync.Once
	dir  string
	ok   bool
}

// NewTemplate returns a template that applies the migrations and then the seed function.
// The template is built the first time an app is created from it.
func NewTemplate(seed func(t testing.TB, app core.App)) *Template {
	tpl := &Template{seed: seed}

	templatesMu.Lock()
	templates = append(templates, tpl)
	templatesMu.Unlock()

	return tpl
}

// App returns a new test app cloned from the template. It is cleaned up when the test ends.
func (tpl *Template) App(t testing.TB) *tests.TestApp {
	t.Helper()

	testApp := tpl.clone(t)
	t.Cleanup(testApp.Cleanup)
	return testApp
}

// Factory returns a TestAppFactory for tests.ApiScenario, which cleans up the app itself.
func (tpl *Template) Factory() func(t testing.TB) *tests.TestApp {
	return func(t testing.TB) *tests.TestApp {
		t.Helper()
		return tpl.clone(t)
	}
}

func (tpl *Template) clone(t testing.TB) *tests.TestApp {
	t.Helper()

	tpl.once.Do(func() { tpl.build(t) })
	if !tpl.ok {
		t.Fatal("test app template failed to build, see the first failing test")
	}

	testApp, err := newApp(tpl.dir)
	if err != nil {
		t.Fatalf("failed to create test app: %v", err)
	}
	return testApp
}

func (tpl *Template) build(t testing.TB) {
	t.Helper()

	emptyDir, err := os.MkdirTemp("", "surmai_template_")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(emptyDir)

	// newApp copies the given directory, runs the migrations and registers the hooks
	testApp, err := newApp(emptyDir)
	if err != nil {
		t.Fatalf("failed to create test app: %v", err)
	}
	defer testApp.Cleanup()

	if tpl.seed != nil {
		tpl.seed(t, testApp)
	}

	// flush the write-ahead logs so the copied database files are complete
	for _, db := range []interface {
		NewQuery(string) *dbx.Query
	}{testApp.DB(), testApp.AuxDB()} {
		if _, err := db.NewQuery("PRAGMA wal_checkpoint(TRUNCATE)").Execute(); err != nil {
			t.Fatalf("failed to checkpoint database: %v", err)
		}
	}

	dir, err := tests.TempDirClone(testApp.DataDir())
	if err != nil {
		t.Fatalf("failed to copy template data directory: %v", err)
	}

	tpl.dir = dir
	tpl.ok = true
}

// Main runs the tests and removes the template data directories afterwards.
// Call it from TestMain in packages that use testutil:
//
//	func TestMain(m *testing.M) { testutil.Main(m) }
func Main(m *testing.M) {
	code := m.Run()

	templatesMu.Lock()
	for _, tpl := range templates {
		if tpl.dir != "" {
			_ = os.RemoveAll(tpl.dir)
		}
	}
	templatesMu.Unlock()

	os.Exit(code)
}
