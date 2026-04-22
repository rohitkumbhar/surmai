package routes

import (
	"backend/jobs"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

func ImportBookingsNow(e *core.RequestEvent) error {
	job := jobs.ImportBookingsFromEmailJob{
		App: e.App,
	}

	go job.Execute()

	return e.JSON(http.StatusOK, map[string]string{})
}
