package routes

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"net/http"
	"strconv"
)

func GetTimeZone(e *core.RequestEvent, timezoneFinder tzf.F) error {

	requestInfo, _ := e.RequestInfo()
	latitudeStr, _ := requestInfo.Query["latitude"]
	longitudeStr, _ := requestInfo.Query["longitude"]

	lat, _ := strconv.ParseFloat(latitudeStr, 64)
	long, _ := strconv.ParseFloat(longitudeStr, 64)

	name := timezoneFinder.GetTimezoneName(long, lat)
	return e.JSON(http.StatusOK, map[string]any{"value": name})
}
