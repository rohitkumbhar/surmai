package routes

import (
	"backend/assistant/ai"
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

	response, err := ai.TestConnection(app, prompt)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, map[string]string{"llmResponse": response})
}
