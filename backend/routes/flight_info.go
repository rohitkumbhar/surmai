package routes

import (
	"backend/cache"
	"backend/flights"
	"backend/flights/adsdb"
	"backend/flights/flightaware"
	"encoding/json"
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"net/http"
	"time"
)

func GetFlightRoute(e *core.RequestEvent, finder tzf.F) error {
	flightNumber := e.Request.PathValue("flightNumber")

	val, found := cache.Get(fmt.Sprintf("flight-%s", flightNumber))
	if found {
		if val == nil {
			return e.JSON(http.StatusNotFound, "")
		} else {
			return e.JSON(http.StatusOK, val)
		}
	}

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
		cache.Set(fmt.Sprintf("flight-%s", flightNumber), nil, 5*time.Minute)
		return e.JSON(http.StatusNotFound, "")
	}
	cache.Set(fmt.Sprintf("flight-%s", flightNumber), route, 5*time.Minute)
	return e.JSON(http.StatusOK, route)
}
