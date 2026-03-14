package middleware

import (
	"strings"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
)

func RequireTripAccess() *hook.Handler[*core.RequestEvent] {
	return &hook.Handler[*core.RequestEvent]{
		Id:   "surmaiRequireTripAccess",
		Func: requireTripAccess(),
	}
}

func requireTripAccess() func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		requestInfo, _ := e.RequestInfo()
		tripId := e.Request.PathValue("tripId")
		app := e.App

		trip, err := app.FindRecordById("trips", tripId)
		if err != nil {
			app.Logger().Error("Unable to find trip record", "id", tripId)
			return err
		}

		rule := trip.Collection().ViewRule
		requestMethod := strings.ToUpper(requestInfo.Method)
		if requestMethod == "POST" || requestMethod == "PUT" {
			rule = trip.Collection().UpdateRule

			// DELETE has its own rule
		}

		canAccess, err := app.CanAccessRecord(trip, requestInfo, rule)
		if err != nil {
			app.Logger().Error("User cannot access trip", "id", tripId)
			return err
		}
		if !canAccess {
			return e.UnauthorizedError("Cannot access this trip", nil)
		}

		e.Set("trip", trip)
		return e.Next()
	}
}
