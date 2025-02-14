package routes

import (
	"errors"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func GetTripCollaborators(e *core.RequestEvent) error {

	requestInfo, _ := e.RequestInfo()
	tripId, _ := requestInfo.Query["tripId"]
	trip, err := e.App.FindRecordById("trips", tripId)
	if err != nil {
		return err
	}

	canAccess, err := e.App.CanAccessRecord(trip, requestInfo, trip.Collection().ViewRule)
	if err != nil {
		return err
	}

	if !canAccess {
		return errors.New("not authorized to access this trip")
	}

	collaborators := trip.GetStringSlice("collaborators")
	collaboratorRecords, err := e.App.FindRecordsByIds("users", collaborators)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, collaboratorRecords)
}
