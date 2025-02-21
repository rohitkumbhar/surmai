package routes

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"log"
	"net/http"
	"os"
)

type Airline struct {
	Name string `json:"name"`
	Logo string `json:"logo"`
	Id   string `json:"id"`
}

func LoadAirlinesDataset(e *core.RequestEvent) error {

	places, err := e.App.FindCollectionByNameOrId("airlines")
	if err != nil {
		return e.BadRequestError("Collection `airlines` does not exists", nil)
	}

	content, err := os.ReadFile("./datasets/airlines.json")
	if err != nil {
		log.Fatal("Error when opening file: ", err)
	}

	// Now let's unmarshall the data into `payload`
	var payload []Airline
	err = json.Unmarshal(content, &payload)
	if err != nil {
		log.Fatal("Error during Unmarshal(): ", err)
	}

	recordCount, err := e.App.CountRecords("airlines")
	if err != nil {
		return err
	} else if recordCount > 0 {
		return e.JSON(http.StatusOK, map[string]int{"count": int(recordCount)})
	}

	for _, airline := range payload {

		record := core.NewRecord(places)
		record.Set("name", airline.Name)
		record.Set("code", airline.Id)
		record.Set("logo", airline.Logo)
		err := e.App.Save(record)
		if err != nil {
			log.Printf("Error saving record: %v", err)
		}

	}

	return e.JSON(http.StatusOK, map[string]int{"count": len(payload)})
}
