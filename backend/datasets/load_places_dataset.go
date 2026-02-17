package datasets

import (
	"compress/gzip"
	"encoding/json"
	"errors"
	"io"
	"log"
	"os"
	"strconv"
	"unicode"

	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
)

type Place struct {
	Name         string            `json:"name"`
	Latitude     string            `json:"latitude"`
	Longitude    string            `json:"longitude"`
	StateCode    string            `json:"state_code"`
	StateName    string            `json:"state_name"`
	CountryCode  string            `json:"country_code"`
	CountryName  string            `json:"country_name"`
	TimeZone     string            `json:"timezone"`
	Translations map[string]string `json:"translations"`
}

func LoadPlacesDataset(app core.App, finder tzf.F) (int64, error) {

	places, err := app.FindCollectionByNameOrId("places")
	if err != nil {
		return -1, errors.New("collection `places` does not exists")
	}

	compressedDatasetsFile, err := os.Open("./datasets/places-2026-02.json.gz")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}
	defer compressedDatasetsFile.Close()

	dataset, err := gzip.NewReader(compressedDatasetsFile)
	if err != nil {
		log.Fatal("Error creating gzip reader: ", err)
	}
	defer dataset.Close()

	content, err := io.ReadAll(dataset)
	if err != nil {
		log.Fatal("Error reading gzip content: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Place
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
		return -1, err
	}

	err = app.RunInTransaction(func(txApp core.App) error {

		err = txApp.TruncateCollection(places)
		if err != nil {
			return err
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
			record.Set("asciiName", AsciiName(place.Name))

			if place.Translations != nil {
				record.Set("translations", place.Translations)
			}

			if place.TimeZone != "" {
				record.Set("timezone", place.TimeZone)
			} else if place.Latitude != "" && place.Longitude != "" {
				lat, _ := strconv.ParseFloat(place.Latitude, 64)
				long, _ := strconv.ParseFloat(place.Longitude, 64)
				timezone := finder.GetTimezoneName(long, lat)
				record.Set("timezone", timezone)
			}

			err := txApp.Save(record)
			if err != nil {
				log.Printf("Error saving record: %v", err)
			}

		}

		return nil
	})

	recordCount, err := app.CountRecords("places")
	if err != nil {
		return -1, err
	}

	return recordCount, nil
}

func isMn(r rune) bool {
	return unicode.Is(unicode.Mn, r) // Mn: nonspacing marks
}
