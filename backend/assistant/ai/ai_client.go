package ai

import (
	bt "backend/types"
	"context"
	"encoding/json"
	"fmt"

	"github.com/invopop/jsonschema"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"github.com/pocketbase/pocketbase/core"
)

type Ai struct {
	Config *bt.OpenAiEndpointConfig
}

func loadAiConfig(app core.App) (*bt.OpenAiEndpointConfig, error) {

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

func TestConnection(app core.App, prompt string) (string, error) {

	config, err := loadAiConfig(app)

	if err != nil {
		return "", err
	}

	ctx := context.Background()
	client := openai.NewClient(
		option.WithAPIKey(config.ApiKey),
		option.WithBaseURL(config.Endpoint),
	)
	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(prompt)},
		Model: config.Model,
	})

	if err != nil {
		return "", err
	}

	llmResponse := resp.OutputText()
	return llmResponse, nil
}

func GenerateSchema[T any]() map[string]any {
	reflector := jsonschema.Reflector{
		AllowAdditionalProperties: false,
		DoNotReference:            true,
	}
	var v T
	schema := reflector.Reflect(v)

	data, _ := json.Marshal(schema)
	var result map[string]any
	_ = json.Unmarshal(data, &result)
	return result
}

func Call[ResponseSchema any](app core.App, instructions string, input string, result *ResponseSchema) error {

	responseSchema := GenerateSchema[ResponseSchema]()
	config, err := loadAiConfig(app)

	if err != nil {
		return err
	}

	ctx := context.Background()
	client := openai.NewClient(
		option.WithAPIKey(config.ApiKey),
		option.WithBaseURL(config.Endpoint),
	)
	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Temperature:  openai.Float(0.1),
		Instructions: openai.String(instructions),
		Input:        responses.ResponseNewParamsInputUnion{OfString: openai.String(input)},
		Model:        config.Model,
		Text: responses.ResponseTextConfigParam{
			Format: responses.ResponseFormatTextConfigParamOfJSONSchema(
				"response",
				responseSchema,
			),
		},
	})

	if err != nil {
		return err
	}

	err = json.Unmarshal([]byte(resp.OutputText()), result)

	if err != nil {
		return err
	}
	return nil
}
