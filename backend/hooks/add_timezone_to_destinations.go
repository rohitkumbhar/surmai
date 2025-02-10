package hooks

import (
	bt "backend/types"
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"strconv"
)

func AddTimezoneToDestinations(e *core.RecordEvent, finder tzf.F) error {

	record := e.Record
	destinations := record.GetString("destinations")

	var payload []bt.Destination
	err := json.Unmarshal([]byte((destinations)), &payload)

	var updatedDestinations = make([]bt.Destination, len(payload))
	if err != nil {
		return err
	}

	for i, destination := range payload {
		updatedDestination := bt.Destination{
			Id:          destination.Id,
			Name:        destination.Name,
			CountryName: destination.CountryName,
			StateName:   destination.StateName,
			Latitude:    destination.Latitude,
			Longitude:   destination.Longitude,
			TimeZone:    destination.TimeZone,
		}

		if destination.Latitude != "" && destination.Longitude != "" {
			timezone := destination.TimeZone
			if timezone == "" {
				lat, _ := strconv.ParseFloat(destination.Latitude, 64)
				long, _ := strconv.ParseFloat(destination.Longitude, 64)
				updatedDestination.TimeZone = finder.GetTimezoneName(long, lat)
			}
		}

		updatedDestinations[i] = updatedDestination

	}

	record.Set("destinations", updatedDestinations)
	return e.Next()
}
