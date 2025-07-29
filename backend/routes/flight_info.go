package routes

import (
	"backend/flights/adsdb"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"net/http"
)

func GetFlightRoute(e *core.RequestEvent, finder tzf.F) error {
	flightNumber := e.Request.PathValue("flightNumber")
	flightsDataProvider := adsdb.AdsbDbCom{}
	route, err := flightsDataProvider.GetFlightRoute(flightNumber, finder)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, route)
}
