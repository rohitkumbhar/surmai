package routes

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"log"
	"net/http"
	"os"
)

type Place struct {
	Name        string `json:"name"`
	Latitude    string `json:"latitude"`
	Longitude   string `json:"longitude"`
	StateCode   string `json:"state_code"`
	StateName   string `json:"state_name"`
	CountryCode string `json:"country_code"`
	CountryName string `json:"country_name"`
}

func LoadPlacesDataset(e *core.RequestEvent) error {

	places, err := e.App.FindCollectionByNameOrId("places")
	if err != nil {
		return e.BadRequestError("Collection `places` does not exists", nil)
	}

	content, err := os.ReadFile("/datasets/places.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Place
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}

	recordCount, err := e.App.CountRecords("places")
	if err != nil {
		return err
	} else if recordCount > 0 {
		return e.JSON(http.StatusOK, map[string]int{"count": int(recordCount)})
	}

	for _, place := range payload {

		record := core.NewRecord(places)
		record.Set("name", place.Name)
		record.Set("stateCode", place.StateCode)
		record.Set("stateName", place.StateName)
		record.Set("countryCode", place.CountryCode)
		record.Set("countryName", place.CountryName)
		record.Set("latitude", place.Latitude)
		record.Set("longitude", place.Longitude)
		err := e.App.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}

	}

	return e.JSON(http.StatusOK, map[string]int{"count": len(payload)})
}
