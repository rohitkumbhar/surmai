package routes

import (
	"backend/types"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func SiteSettings(e *core.RequestEvent, demoMode bool, version types.VersionInfo) error {

	_, riErr := e.RequestInfo()
	if riErr != nil {
		return riErr
	}
	data := map[string]any{
		"emailEnabled":   e.App.Settings().SMTP.Enabled,
		"demoMode":       demoMode,
		"signupsEnabled": signupsEnabled(e),
		"version":        version,
	}
	return e.JSON(http.StatusOK, data)

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
