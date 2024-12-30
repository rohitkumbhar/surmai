package routes

import (
	"backend/trips"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func ImportTrip(e *core.RequestEvent) error {

	info, riErr := e.RequestInfo()
	if riErr != nil {
		return riErr
	}
	currentUserId := info.Auth.Id

	file, _, err := e.Request.FormFile("tripData")
	if err != nil {
		return err
	}

	defer file.Close()

	tripId, importError := trips.Import(e.App, file, currentUserId)
	if importError != nil {
		return importError
	}

	return e.JSON(http.StatusOK, map[string]any{"tripId": tripId})
}
