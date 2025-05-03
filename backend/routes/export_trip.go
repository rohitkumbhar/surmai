package routes

import (
	"backend/trips"
	"encoding/base64"
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
	"os"
)

func ExportTrip(e *core.RequestEvent) error {
	trip := e.Get("trip").(*core.Record)

	tripExport, err := os.CreateTemp("", fmt.Sprintf("trip-export-%s", trip.Id))
	if err != nil {
		return err
	}
	defer tripExport.Close()

	err = trips.ExportTripArchive(e.App, trip, tripExport)
	if err != nil {
		return err
	}

	file, err := os.ReadFile(tripExport.Name())
	if err != nil {
		return err
	}

	base64Str := base64.StdEncoding.EncodeToString(file)
	return e.JSON(http.StatusOK, map[string]string{
		"data": base64Str,
	})
}
