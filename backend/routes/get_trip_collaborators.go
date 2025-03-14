package routes

import (
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func GetTripCollaborators(e *core.RequestEvent) error {

	trip := e.Get("trip").(*core.Record)
	collaborators := trip.GetStringSlice("collaborators")
	collaboratorRecords, err := e.App.FindRecordsByIds("users", collaborators)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, collaboratorRecords)
}
