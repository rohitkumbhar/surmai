package ai

import (
	bt "backend/types"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type Assistant interface {
	FlightInfoRequest(body string, settings *bt.LlmSettings, responseSchema *map[string]interface{}) (*http.Request, error)
	ParseResponse(res map[string]interface{}) bt.InferFlightDataResults
}

var FlightInfoRequestSchema = map[string]interface{}{
	"type":                 "object",
	"required":             []string{"flights", "lodgings"},
	"additionalProperties": false,
	"properties": map[string]interface{}{

		"lodgings": map[string]interface{}{
			"type": "array",
			"items": map[string]interface{}{
				"type":                 "object",
				"additionalProperties": false,
				"required":             []string{"name", "address", "check_in_date", "check_in_time", "checkout_out_date", "check_out_time"},
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type": "string",
					},
					"address": map[string]interface{}{
						"type": "string",
					},
					"check_in_date": map[string]interface{}{
						"type": "string",
					},
					"check_out_date": map[string]interface{}{
						"type": "string",
					},
					"check_in_time": map[string]interface{}{
						"type": "string",
					},
					"check_out_time": map[string]interface{}{
						"type": "string",
					},
				},
			},
		},

		"flights": map[string]interface{}{
			"type": "array",
			"items": map[string]interface{}{
				"type":                 "object",
				"additionalProperties": false,
				"required": []string{
					"departure_date",
					"arrival_date",
					"departure_time",
					"arrival_time",
					"arrival_airport_iata_code",
					"departure_airport_iata_code",
					"arrival_airport_name",
					"departure_airport_name",
					"airline_name",
					"confirmation_code",
					"cost"},
				"properties": map[string]interface{}{
					"departure_date": map[string]interface{}{
						"type": "string",
					},
					"arrival_date": map[string]interface{}{
						"type": "string",
					},
					"departure_time": map[string]interface{}{
						"type": "string",
					},
					"arrival_time": map[string]interface{}{
						"type": "string",
					},
					"departure_airport_name": map[string]interface{}{
						"type": "string",
					},
					"arrival_airport_name": map[string]interface{}{
						"type": "string",
					},
					"departure_airport_iata_code": map[string]interface{}{
						"type": "string",
					},
					"arrival_airport_iata_code": map[string]interface{}{
						"type": "string",
					},
					"airline_name": map[string]interface{}{
						"type": "string",
					},
					"confirmation_code": map[string]interface{}{
						"type": "string",
					},

					"cost": map[string]interface{}{
						"type":                 "object",
						"additionalProperties": false,
						"required":             []string{"amount", "currency_code"},
						"properties": map[string]interface{}{
							"amount": map[string]interface{}{
								"type": "number",
							},
							"currency_code": map[string]interface{}{
								"type": "string",
							},
						},
					},
				},
			},
		},
	},
}

func FindFlightInformation(assistant Assistant, settings *bt.LlmSettings, body string) bt.InferFlightDataResults {

	// Build the request for the agent
	req, err := assistant.FlightInfoRequest(body, settings, &FlightInfoRequestSchema)
	if err != nil {
		return bt.InferFlightDataResults{
			Error: err,
		}
	}

	// Make the actual request
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return bt.InferFlightDataResults{
			Error: err,
		}
	}

	// Unwrap the response
	var resData map[string]interface{}
	err = json.NewDecoder(res.Body).Decode(&resData)
	if err != nil {
		return bt.InferFlightDataResults{
			Error: err,
		}
	}

	if res.StatusCode != 200 {
		return bt.InferFlightDataResults{
			Error: errors.New(fmt.Sprint(err)),
		}
	}

	return assistant.ParseResponse(resData)

}
