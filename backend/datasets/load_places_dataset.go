package datasets

import (
	"encoding/json"
	"errors"
	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
	"log"
	"os"
	"strconv"
	"unicode"
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

func LoadPlacesDataset(app core.App, finder tzf.F) (int, error) {

	places, err := app.FindCollectionByNameOrId("places")
	if err != nil {
		return -1, errors.New("collection `places` does not exists")
	}

	content, err := os.ReadFile("./datasets/places.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Place
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}

	recordCount, err := app.CountRecords("places")
	if err != nil {
		return -1, err
	} else if recordCount > 0 {
		return int(recordCount), nil
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

		if place.Latitude != "" && place.Longitude != "" {
			lat, _ := strconv.ParseFloat(place.Latitude, 64)
			long, _ := strconv.ParseFloat(place.Longitude, 64)
			timezone := finder.GetTimezoneName(long, lat)
			record.Set("timezone", timezone)
		}

		record.Set("asciiName", AsciiName(place.Name))

		err := app.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}

	}

	return len(payload), nil
}

func isMn(r rune) bool {
	return unicode.Is(unicode.Mn, r) // Mn: nonspacing marks
}
