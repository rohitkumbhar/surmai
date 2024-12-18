package routes

import (
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func ImpersonateAction(e *core.RequestEvent) error {

	info, _ := e.RequestInfo()
	email, _ := info.Body["email"].(string)

	user, err := e.App.FindAuthRecordByEmail("users", email)
	if err != nil {
		return e.UnauthorizedError("User not found", nil)
	}

	return apis.RecordAuthResponse(e, user, "email", nil)
}
