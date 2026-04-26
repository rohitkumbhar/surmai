package jobs

import (
	"backend/assistant"
	"backend/settings"

	"github.com/pocketbase/pocketbase/core"
)

type ImportBookingsFromEmailJob struct {
	App core.App
}

func (job *ImportBookingsFromEmailJob) Execute() {

	config, err := settings.FetchEmailSyncConfig(job.App)
	if err == nil && config.Enabled {
		if err = assistant.ImportBookingsFromEmails(job.App); err != nil {
			job.App.Logger().Error("Error importing bookings from email: %v", err)
		}
	}
}
