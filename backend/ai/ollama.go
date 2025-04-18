package ai

import (
	bt "backend/types"
	"bytes"
	"encoding/json"
	"net/http"
)

type Ollama struct {
}

func (ollama *Ollama) FlightInfoRequest(body string, settings *bt.LlmSettings, responseSchema *map[string]interface{}) (*http.Request, error) {

	systemPrompt := map[string]any{
		"role":    "user",
		"content": "You are an expert at structured data extraction. You will be given unstructured text from an email and you have to extract flight information from it",
	}

	prompt := map[string]any{
		"role":    "user",
		"content": body,
	}

	messages := make([]map[string]any, 0)
	messages = append(messages, systemPrompt)
	messages = append(messages, prompt)
	values := map[string]interface{}{
		"model":    settings.ModelName,
		"stream":   false,
		"messages": messages,
		"format":   responseSchema,
		"options": map[string]interface{}{
			"temperature": 0,
		},
	}

	payload, err := json.Marshal(values)
	if err != nil {
		return nil, err
	}

	bodyReader := bytes.NewBuffer(payload)
	req, err := http.NewRequest(http.MethodPost, settings.OllamaServerUrl, bodyReader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	return req, nil

}

func (ollama *Ollama) ParseResponse(response map[string]interface{}) bt.InferFlightDataResults {

	var inferredFlights bt.FlightDataSchema
	aiResponseMessage := response["message"].(map[string]any)["content"].(string)
	err := json.Unmarshal([]byte(aiResponseMessage), &inferredFlights)
	if err != nil {
		return bt.InferFlightDataResults{
			Error: err,
		}
	}

	return bt.InferFlightDataResults{
		Flights: inferredFlights.Flights,
	}
}
