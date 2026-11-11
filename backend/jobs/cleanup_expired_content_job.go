package jobs

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"

	"github.com/pocketbase/dbx"
)

type CleanupExpiredContentJob struct {
	App core.App
}

func (job *CleanupExpiredContentJob) Execute() {
	app := job.App
	logger := app.Logger().WithGroup("CleanupExpiredContentJob")

	// Compare against a types.DateTime: binding a time.Time formats it with
	// Go's String(), which does not match the stored format and is offset by
	// the server's time zone. An empty expiry sorts below every date, so it
	// has to be excluded or content that never expires would be deleted.
	now := types.NowDateTime()

	// Delete all expired announcements
	expiredAnnouncements, err := app.FindAllRecords("announcements",
		dbx.NewExp("expiry != '' AND expiry < {:now}", dbx.Params{"now": now}))

	if err != nil {
		logger.Error("FindAllRecords error", "error", err)
	} else {
		for _, announcement := range expiredAnnouncements {
			if err := app.Delete(announcement); err != nil {
				logger.Error("Delete error", "announcementId", announcement.Id, "error", err)
			}
		}
		logger.Info("Deleted expired announcements", "count", len(expiredAnnouncements))
	}

	// Delete all expired notifications
	expiredNotifications, err := app.FindAllRecords("notifications",
		dbx.NewExp("expiry != '' AND expiry < {:now}", dbx.Params{"now": now}))

	if err != nil {
		logger.Error("FindAllRecords error", "error", err)
	} else {
		for _, notification := range expiredNotifications {
			if err := app.Delete(notification); err != nil {
				logger.Error("Delete error", "notificationId", notification.Id, "error", err)
			}
		}
		logger.Info("Deleted expired notifications", "count", len(expiredNotifications))
	}
}
