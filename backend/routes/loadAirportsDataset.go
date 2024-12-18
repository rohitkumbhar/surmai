package routes

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"log"
	"net/http"
	"os"
)

type Airport struct {
	Name       string `json:"name"`
	Latitude   string `json:"latitude_deg"`
	Longitude  string `json:"longitude_deg"`
	IataCode   string `json:"iata_code"`
	IsoCountry string `json:"iso_country"`
}

func LoadAirportsDataset(e *core.RequestEvent) error {

	places, err := e.App.FindCollectionByNameOrId("airports")
	if err != nil {
		return e.BadRequestError("Collection `airports` does not exists", nil)
	}

	content, err := os.ReadFile("/datasets/airports.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Airport
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}

	recordCount, err := e.App.CountRecords("airports")
	if err != nil {
		return err
	} else if recordCount > 0 {
		return e.JSON(http.StatusOK, map[string]int{"count": int(recordCount)})
	}

	for _, airport := range payload {

		record := core.NewRecord(places)
		record.Set("name", airport.Name)
		record.Set("iataCode", airport.IataCode)
		record.Set("isoCountry", airport.IsoCountry)
		record.Set("latitude", airport.Latitude)
		record.Set("longitude", airport.Longitude)
		err := e.App.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}

	}

	return e.JSON(http.StatusOK, map[string]int{"count": len(payload)})
}
