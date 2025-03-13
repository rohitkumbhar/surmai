package datasets

import (
	"encoding/json"
	"errors"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"log"
	"os"
	"strconv"
)

type Airport struct {
	Name       string `json:"name"`
	Latitude   string `json:"latitude_deg"`
	Longitude  string `json:"longitude_deg"`
	IataCode   string `json:"iata_code"`
	IsoCountry string `json:"iso_country"`
}

func LoadAirportsDataset(app core.App, finder tzf.F) (int, error) {

	places, err := app.FindCollectionByNameOrId("airports")
	if err != nil {
		return -1, errors.New("collection `airports` does not exists")
	}

	content, err := os.ReadFile("./datasets/airports.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Airport
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}

	recordCount, err := app.CountRecords("airports")
	if err != nil {
		return -1, err
	} else if recordCount > 0 {
		return int(recordCount), nil
	}

	for _, airport := range payload {

		record := core.NewRecord(places)
		record.Set("name", airport.Name)
		record.Set("iataCode", airport.IataCode)
		record.Set("isoCountry", airport.IsoCountry)
		record.Set("latitude", airport.Latitude)
		record.Set("longitude", airport.Longitude)

		if airport.Latitude != "" && airport.Longitude != "" {
			lat, _ := strconv.ParseFloat(airport.Latitude, 64)
			long, _ := strconv.ParseFloat(airport.Longitude, 64)
			timezone := finder.GetTimezoneName(long, lat)
			record.Set("timezone", timezone)
		}

		err := app.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}
	}

	return len(payload), nil
}
