package middleware

import (
	bt "backend/types"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
	"net/http"
)

func RequireSurmaiSecret(settings *bt.EmailWebhookSettings) *hook.Handler[*core.RequestEvent] {
	return &hook.Handler[*core.RequestEvent]{
		Id:   "surmaiRequireTripAccess",
		Func: verifySurmaiSecret(settings),
	}
}

func verifySurmaiSecret(settings *bt.EmailWebhookSettings) func(*core.RequestEvent) error {

	return func(e *core.RequestEvent) error {

		if !settings.Enabled {
			return e.JSON(http.StatusUnauthorized, "Unauthorized")
		}

		surmaiSecretHeaderValue := e.Request.Header.Get("X-Surmai-Secret")
		pass := settings.WebhookSecret == surmaiSecretHeaderValue

		if !pass {
			return e.JSON(http.StatusUnauthorized, "Unauthorized")
		}
		return e.Next()
	}
}
