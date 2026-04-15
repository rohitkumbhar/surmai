package routes

import (
	"backend/assistant"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

func TestOpenAiEndpoint(e *core.RequestEvent) error {

	app := e.App
	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	prompt := info.Body["prompt"].(string)

	aiClient, err := assistant.New(app)
	if err != nil {
		return err
	}

	response, err := aiClient.TestConnection(prompt)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, map[string]string{"llmResponse": response})
}
