package hooks

import (
	"backend/trips"
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"strconv"
)

func AddTimezoneToDestinations(e *core.RecordEvent, finder tzf.F) error {

	record := e.Record
	destinations := record.GetString("destinations")

	var payload []trips.Destination
	err := json.Unmarshal([]byte((destinations)), &payload)

	var updatedDestinations = make([]trips.Destination, len(payload))

	if err != nil {
		return err
	}

	for i, destination := range payload {
		if destination.Latitude != "" && destination.Longitude != "" {

			timezone := destination.TimeZone
			if timezone == "" {
				lat, _ := strconv.ParseFloat(destination.Latitude, 64)
				long, _ := strconv.ParseFloat(destination.Longitude, 64)
				timezone = finder.GetTimezoneName(long, lat)
			}

			updatedDestinations[i] = trips.Destination{
				Id:          destination.Id,
				Name:        destination.Name,
				StateName:   destination.StateName,
				CountryName: destination.CountryName,
				Latitude:    destination.Latitude,
				Longitude:   destination.Longitude,
				TimeZone:    timezone,
			}
		}
	}

	record.Set("destinations", updatedDestinations)
	return e.Next()
}
