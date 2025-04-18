package ai

import (
	bt "backend/types"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type OpenAI struct {
}

func (openai *OpenAI) FlightInfoRequest(body string, settings *bt.LlmSettings, responseSchema *map[string]interface{}) (*http.Request, error) {

	systemPrompt := map[string]any{
		"role": "user",
		"content": "You are an expert at structured data extraction. " +
			"You will be given unstructured text from an email and you have to extract " +
			"flight information from it. The dates should be in YYYY-MM-DD format and time should be in 24 hour format",
	}

	prompt := map[string]any{
		"role":    "user",
		"content": body,
	}

	messages := make([]map[string]any, 0)
	messages = append(messages, systemPrompt)
	messages = append(messages, prompt)
	values := map[string]interface{}{
		"model":  settings.ModelName,
		"stream": false,
		"input":  messages,
		"text": map[string]interface{}{
			"format": map[string]interface{}{
				"type":   "json_schema",
				"name":   "FlightDataSchema",
				"schema": responseSchema,
			},
		},
	}

	payload, err := json.Marshal(values)
	if err != nil {
		return nil, err
	}
	bodyReader := bytes.NewBuffer(payload)
	req, err := http.NewRequest(http.MethodPost, "https://api.openai.com/v1/responses", bodyReader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", settings.OpenAIApiKey))
	req.Header.Set("Content-Type", "application/json")

	return req, nil

}

func (openai *OpenAI) ParseResponse(response map[string]interface{}) bt.InferFlightDataResults {
	var inferredFlights bt.FlightDataSchema
	aiResponseMessage := response["output"].([]interface{})[0].(map[string]interface{})
	content := aiResponseMessage["content"].([]interface{})[0].(map[string]any)
	text := content["text"].(string)
	err := json.Unmarshal([]byte(text), &inferredFlights)
	if err != nil {
		return bt.InferFlightDataResults{
			Error: err,
		}
	}

	return bt.InferFlightDataResults{
		Flights: inferredFlights.Flights,
	}
}
