package routes_test

import (
	"backend/testutil"
	"net/http"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

func TestSiteSettings(t *testing.T) {
	scenarios := []tests.ApiScenario{
		{
			Name:           "signups are enabled by default",
			Method:         http.MethodGet,
			URL:            "/site-settings.json",
			TestAppFactory: testutil.AppFactory(nil),
			ExpectedStatus: http.StatusOK,
			ExpectedContent: []string{
				`"signupsEnabled":true`,
				`"emailEnabled":false`,
				`"demoMode":false`,
			},
		},
		{
			Name:   "signups are disabled when users cannot be created",
			Method: http.MethodGet,
			URL:    "/site-settings.json",
			TestAppFactory: testutil.AppFactory(func(t testing.TB, app *tests.TestApp) {
				users, err := app.FindCollectionByNameOrId("users")
				if err != nil {
					t.Fatal(err)
				}
				users.CreateRule = nil
				if err := app.Save(users); err != nil {
					t.Fatal(err)
				}
			}),
			ExpectedStatus:  http.StatusOK,
			ExpectedContent: []string{`"signupsEnabled":false`},
		},
	}

	for _, scenario := range scenarios {
		scenario.Test(t)
	}
}
