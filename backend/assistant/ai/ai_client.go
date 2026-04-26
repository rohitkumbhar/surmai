package ai

import (
	"backend/settings"
	bt "backend/types"
	"context"
	"encoding/json"

	"github.com/invopop/jsonschema"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"github.com/pocketbase/pocketbase/core"
)

type Ai struct {
	Config *bt.OpenAiEndpointConfig
}

func TestConnection(app core.App, prompt string) (string, error) {

	config, err := settings.FetchAiConfig(app)

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

type CallResult[T any] struct {
	Result T
	Err    error
}

func Call[ResponseSchema any](app core.App, instructions string, input string, resultChan chan<- CallResult[ResponseSchema]) {
	responseSchema := GenerateSchema[ResponseSchema]()

	go func() {
		config, err := settings.FetchAiConfig(app)

		if err != nil {
			resultChan <- CallResult[ResponseSchema]{Err: err}
			return
		}

		ctx := context.Background()
		client := openai.NewClient(
			option.WithAPIKey(config.ApiKey),
			option.WithBaseURL(config.Endpoint),
		)
		resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
			//Temperature:  openai.Float(0.1),
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
			resultChan <- CallResult[ResponseSchema]{Err: err}
			return
		}

		var result ResponseSchema
		err = json.Unmarshal([]byte(resp.OutputText()), &result)

		if err != nil {
			resultChan <- CallResult[ResponseSchema]{Err: err}
			return
		}

		resultChan <- CallResult[ResponseSchema]{Result: result}
	}()
}
