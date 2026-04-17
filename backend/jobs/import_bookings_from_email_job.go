package jobs

import (
	"backend/assistant"

	"github.com/pocketbase/pocketbase/core"
)

type ImportBookingsFromEmailJob struct {
	App core.App
}

func (job *ImportBookingsFromEmailJob) Execute() {
	if err := assistant.ImportBookingsFromEmails(job.App); err != nil {
		job.App.Logger().Error("Error importing bookings from email: %v", err)
	}
}
