// Package testutil provides helpers for testing Surmai against a real,
// throwaway PocketBase instance with all Surmai migrations, routes and hooks bound.
//
// Tests that use it must live in external test packages (e.g. `package hooks_test`)
// because this package imports backend/app, which imports most other packages.
package testutil

import (
	"backend/app"
	"backend/cache"
	_ "backend/migrations"
	"os"
	"sync"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/ringsaturn/tzf"
)

const (
	AdminEmail    = "admin@test.surmai.app"
	AdminPassword = "test-admin-password-123"
)

var (
	finderOnce sync.Once
	finder     tzf.F

	// a template with only the migrations applied, which every new test app is cloned from
	migrated = NewTemplate(nil)
)

// TimezoneFinder returns a timezone finder shared across tests, since building one is slow.
func TimezoneFinder() tzf.F {
	finderOnce.Do(func() {
		f, err := tzf.NewDefaultFinder()
		if err != nil {
			panic(err)
		}
		finder = f
	})
	return finder
}

// NewSurmaiApp returns the SurmaiApp used to register routes and hooks in tests.
func NewSurmaiApp() *app.SurmaiApp {
	return &app.SurmaiApp{
		AdminEmail:     AdminEmail,
		TimezoneFinder: TimezoneFinder(),
	}
}

// NewApp returns a fresh PocketBase test app with all Surmai migrations applied
// and Surmai routes and hooks registered. It is cleaned up when the test ends.
func NewApp(t testing.TB) *tests.TestApp {
	t.Helper()
	return migrated.App(t)
}

// AppFactory returns a TestAppFactory for tests.ApiScenario. The seed function
// runs against the new app before the request, so each scenario gets isolated data.
//
// Seeding many scenarios this way is slow. Prefer a Template when scenarios share seed data.
func AppFactory(seed func(t testing.TB, app *tests.TestApp)) func(t testing.TB) *tests.TestApp {
	return func(t testing.TB) *tests.TestApp {
		t.Helper()

		testApp := migrated.clone(t)
		if seed != nil {
			seed(t, testApp)
		}
		return testApp
	}
}

func newApp(dataDir string) (*tests.TestApp, error) {
	// the superuser migration reads these
	setEnvIfEmpty("SURMAI_ADMIN_EMAIL", AdminEmail)
	setEnvIfEmpty("SURMAI_ADMIN_PASSWORD", AdminPassword)

	testApp, err := tests.NewTestAppWithConfig(core.BaseAppConfig{
		DataDir:       dataDir,
		EncryptionEnv: "pb_test_env",
	})
	if err != nil {
		return nil, err
	}

	// main() initialises the shared cache before serving; a fresh one per test
	// app also keeps cached values from leaking between tests
	cache.InitCache()

	surmai := NewSurmaiApp()
	surmai.RegisterRoutes(testApp)
	surmai.RegisterEventHooks(testApp)

	return testApp, nil
}

func setEnvIfEmpty(key, value string) {
	if os.Getenv(key) == "" {
		_ = os.Setenv(key, value)
	}
}
