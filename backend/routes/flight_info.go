package routes

import (
	"backend/flights"
	"backend/flights/adsdb"
	"backend/flights/flightaware"
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"net/http"
)

func GetFlightRoute(e *core.RequestEvent, finder tzf.F) error {
	flightNumber := e.Request.PathValue("flightNumber")

	configRecord, configError := e.App.FindRecordById("surmai_settings", "flight_info_provider")
	if configError != nil {
		return e.JSON(http.StatusNotFound, "")
	}

	valueJson := configRecord.GetString("value")
	var config flights.FlightInfoProviderConfig
	configError = json.Unmarshal([]byte(valueJson), &config)
	if configError != nil {
		return e.JSON(http.StatusNotFound, "")
	}

	if !config.Enabled {
		return e.JSON(http.StatusNotFound, "")
	}

	var flightsDataProvider flights.DataProvider

	if config.Provider == "flightaware" {
		flightsDataProvider = flightaware.FlightAware{}
	} else if config.Provider == "adsdb" {
		flightsDataProvider = adsdb.AdsbDbCom{}
	} else {
		return e.JSON(http.StatusNotFound, "")
	}

	route, err := flightsDataProvider.GetFlightRoute(flightNumber, config, finder)
	if err != nil {
		return e.JSON(http.StatusNotFound, "")
	}

	return e.JSON(http.StatusOK, route)
}
