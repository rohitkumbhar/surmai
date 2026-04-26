package routes

import (
	"backend/cache"
	"backend/settings"
	"fmt"
	"net/http"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
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

	config, flightsDataProvider, err := settings.FetchFlightInfoProvider(e.App)
	if err != nil {
		return err
	}

	route, err := flightsDataProvider.GetFlightRoute(flightNumber, config, finder)
	if err != nil {
		cache.Set(fmt.Sprintf("flight-%s", flightNumber), nil, 5*time.Minute)
		return e.JSON(http.StatusNotFound, "")
	}
	cache.Set(fmt.Sprintf("flight-%s", flightNumber), route, 5*time.Minute)
	return e.JSON(http.StatusOK, route)
}
