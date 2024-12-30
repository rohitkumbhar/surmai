package routes

import (
	"backend/trips"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func ExportTrip(e *core.RequestEvent) error {

	requestInfo, _ := e.RequestInfo()
	tripId, _ := requestInfo.Body["tripId"].(string)

	trip, err := e.App.FindRecordById("trips", tripId)
	if err != nil {
		e.App.Logger().Error("Unable to find trip record", "id", tripId)
		return err
	}

	canAccess, err := e.App.CanAccessRecord(trip, requestInfo, trip.Collection().ViewRule)
	if err != nil {
		e.App.Logger().Error("User cannot access trip", "id", tripId)
		return err
	}
	if !canAccess {
		return e.UnauthorizedError("Cannot access this trip", nil)
	}

	exportedTrip := trips.Export(e.App, trip)
	return e.JSON(http.StatusOK, exportedTrip)
}
