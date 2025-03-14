package routes

import (
	"backend/trips"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func ExportTrip(e *core.RequestEvent) error {
	trip := e.Get("trip").(*core.Record)
	exportedTrip := trips.Export(e.App, trip)
	return e.JSON(http.StatusOK, exportedTrip)
}
