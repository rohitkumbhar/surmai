package settings

import (
	"backend/flights"
	"backend/flights/adsdb"
	"backend/flights/flightaware"
	bt "backend/types"
	"encoding/json"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
)

func FetchEmailSyncConfig(app core.App) (*bt.EmailSyncConfig, error) {

	config := bt.EmailSyncConfig{}
	emailSyncConfig, err := app.FindRecordById("surmai_settings", "email_sync_config")
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Error getting email_sync_config: %v", err))
		return nil, err
	}

	err = json.Unmarshal([]byte(emailSyncConfig.GetString("value")), &config)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Error unmarshalling email_sync_config: %v", err))
		return nil, err
	}

	return &config, nil
}

func FetchAiConfig(app core.App) (*bt.OpenAiEndpointConfig, error) {
	config := bt.OpenAiEndpointConfig{}
	openAiEndpointConfig, err := app.FindRecordById("surmai_settings", "openai_endpoint_config")

	if err != nil {
		return nil, err
	}

	err = json.Unmarshal([]byte(openAiEndpointConfig.GetString("value")), &config)
	if err != nil {
		return nil, err
	}

	if config.Endpoint == "" {
		return nil, fmt.Errorf("openai compatible endpoint config not found")
	}

	return &config, nil
}

func FetchFlightInfoProvider(app core.App) (*flights.FlightInfoProviderConfig, flights.DataProvider, error) {

	configRecord, configError := app.FindRecordById("surmai_settings", "flight_info_provider")
	if configError != nil {
		return nil, nil, configError
	}

	valueJson := configRecord.GetString("value")
	var config flights.FlightInfoProviderConfig
	configError = json.Unmarshal([]byte(valueJson), &config)
	if configError != nil {
		return nil, nil, configError
	}

	var flightsDataProvider flights.DataProvider

	if config.Provider == "flightaware" {
		flightsDataProvider = flightaware.FlightAware{}
	} else if config.Provider == "adsbdb" {
		flightsDataProvider = adsdb.AdsbDbCom{}
	} else {
		return nil, nil, fmt.Errorf("unknown provider %s", config.Provider)
	}

	return &config, flightsDataProvider, nil
}
