package datasets

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/pocketbase/pocketbase/core"
)

type AirlineDatasetEntry struct {
	Name string `json:"name"`
	Logo string `json:"logo"`
	Id   string `json:"id"`
}

func LoadAirlinesDataset(app core.App) (int, error) {

	airlines, err := app.FindCollectionByNameOrId("airlines")
	if err != nil {
		return -1, errors.New("collection `airlines` does not exists")
	}

	content, err := os.ReadFile(datasetPath("airlines.json"))
	if err != nil {
		return 0, fmt.Errorf("could not read the airlines dataset: %w", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []AirlineDatasetEntry
	err = json.Unmarshal(content, &payload)
	if err != nil {
		return 0, fmt.Errorf("could not read the airlines dataset: %w", err)
	}

	recordCount, err := app.CountRecords("airlines")
	if err != nil {
		return -1, err
	} else if recordCount > 0 {
		return int(recordCount), nil
	}

	for _, airline := range payload {

		record := core.NewRecord(airlines)
		record.Set("name", airline.Name)
		record.Set("code", airline.Id)
		record.Set("logo", airline.Logo)
		err := app.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}
	}

	return len(payload), nil
}
