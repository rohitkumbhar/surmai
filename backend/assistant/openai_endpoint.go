package assistant

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

type Assistant struct {
	AiConfig *bt.OpenAiEndpointConfig
	App      core.App
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

func New(app core.App) (*Assistant, error) {

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

	return &Assistant{
		AiConfig: &config,
		App:      app,
	}, nil
}

func (a *Assistant) TestConnection(prompt string) (string, error) {

	ctx := context.Background()
	client := openai.NewClient(
		option.WithAPIKey(a.AiConfig.ApiKey),
		option.WithBaseURL(a.AiConfig.Endpoint),
	)
	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(prompt)},
		Model: a.AiConfig.Model,
	})

	if err != nil {
		return "", err
	}

	llmResponse := resp.OutputText()
	return llmResponse, nil
}

//
//func TestOpenAiEndpoint(e *core.RequestEvent) error {
//
//	app := e.App
//	info, err := e.RequestInfo()
//	if err != nil {
//		return err
//	}
//
//	prompt := info.Body["prompt"].(string)
//	config := bt.OpenAiEndpointConfig{}
//	emailSyncConfig, _ := app.FindAllRecords("surmai_settings",
//		dbx.NewExp("id = {:configKey} ", dbx.Params{"configKey": "openai_endpoint_config"}))
//
//	if len(emailSyncConfig) == 0 {
//		return nil
//	}
//
//	err = json.Unmarshal([]byte(emailSyncConfig[0].GetString("value")), &config)
//	if err != nil {
//		return nil
//	}
//
//	//
//	if config.Endpoint == "" {
//		return fmt.Errorf("openai compatible endpoint config not found")
//	}
//
//	ctx := context.Background()
//	client := openai.NewClient(
//		option.WithAPIKey(config.ApiKey),
//		option.WithBaseURL(config.Endpoint),
//	)
//	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
//		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(prompt)},
//		Model: config.Model,
//	})
//
//	if err != nil {
//		return err
//	}
//
//	llmResponse := resp.OutputText()
//	return e.JSON(http.StatusOK, map[string]string{"llmResponse": llmResponse})
//}
