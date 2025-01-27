package routes

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/template"
	"net/http"
)

func SiteSettings(e *core.RequestEvent, demoMode bool) error {

	_, riErr := e.RequestInfo()
	if riErr != nil {
		return riErr
	}
	registry := template.NewRegistry()
	settings, renderError := registry.LoadFiles("views/settings.js.template").Render(map[string]any{
		"emailEnabled":   e.App.Settings().SMTP.Enabled,
		"demoMode":       demoMode,
		"signupsEnabled": signupsEnabled(e),
	})

	if renderError != nil {
		// or redirect to a dedicated 404 HTML page
		return e.NotFoundError("", renderError)
	}

	e.Response.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	e.Response.WriteHeader(http.StatusOK)
	_, responseError := e.Response.Write([]byte(settings))
	return responseError

}

func signupsEnabled(e *core.RequestEvent) bool {
	usersCollection, _ := e.App.FindCollectionByNameOrId("users")
	enabled := true
	if usersCollection.CreateRule == nil {
		enabled = false
	} else {
		enabled = *usersCollection.CreateRule == ""
	}
	return enabled
}
