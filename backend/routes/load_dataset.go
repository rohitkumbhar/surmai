package routes

import (
	"backend/datasets"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
	"github.com/ringsaturn/tzf"
)

func LoadDataset(e *core.RequestEvent, finder tzf.F) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}
	datasetName := info.Body["name"]

	if datasetName == "airlines" {
		count, err := datasets.LoadAirlinesDataset(e.App)
		if err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]int{"count": count})
	} else if datasetName == "places" {
		count, err := datasets.LoadPlacesDataset(e.App, finder)
		if err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]int64{"count": count})
	} else if datasetName == "airports" {
		count, err := datasets.LoadAirportsDataset(e.App, finder)
		if err != nil {
			return err
		}
		return e.JSON(http.StatusOK, map[string]int{"count": count})
	}

	return e.JSON(http.StatusBadRequest, map[string]int{"count": -1})

}
