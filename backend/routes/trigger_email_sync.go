package routes

import (
	"backend/jobs"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

func TriggerEmailSync(e *core.RequestEvent) error {
	job := jobs.EmailSyncJob{
		App: e.App,
	}
	job.Execute()
	return e.JSON(http.StatusOK, map[string]string{})
}
