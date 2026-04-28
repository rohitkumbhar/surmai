package hooks

import (
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func CreateNotificationsForNewUser(e *core.RecordEvent) error {
	if err := e.Next(); err != nil {
		return err
	}

	logger := e.App.Logger().WithGroup("CreateNotificationsForNewUser")
	userId := e.Record.Id
	now := time.Now().Format(time.RFC3339)

	// Find all non-expired announcements
	announcements, err := e.App.FindRecordsByFilter(
		"announcements",
		"expiry = '' || expiry > {:now}",
		"-created",
		0,
		0,
		dbx.Params{"now": now},
	)

	if err != nil {
		return nil // No announcements or error
	}

	notificationsCollection, err := e.App.FindCollectionByNameOrId("notifications")
	if err != nil {
		return err
	}

	for _, announcement := range announcements {
		notification := core.NewRecord(notificationsCollection)
		notification.Set("userId", userId)
		notification.Set("subject", announcement.GetString("subject"))
		notification.Set("text", announcement.GetString("text"))
		notification.Set("message", announcement.GetString("message"))
		notification.Set("expiry", announcement.Get("expiry"))
		notification.Set("sender", announcement.GetString("sender"))
		notification.Set("read", false)

		if err := e.App.Save(notification); err != nil {
			logger.Error("Save error", "userId", userId, "announcementId", announcement.Id, "error", err)
		}
	}

	return nil
}

func CreateNotificationsForAnnouncement(e *core.RecordEvent) error {
	if err := e.Next(); err != nil {
		return err
	}

	logger := e.App.Logger().WithGroup("CreateNotificationsForAnnouncement")
	announcement := e.Record
	subject := announcement.GetString("subject")
	text := announcement.GetString("text")
	message := announcement.GetString("message")
	expiry := announcement.Get("expiry")
	sender := announcement.GetString("sender")

	// Find all users
	// Warning: this could be slow if there are many users
	users, err := e.App.FindRecordsByFilter("users", "1=1", "", 0, 0)
	if err != nil {
		return err
	}

	notificationsCollection, err := e.App.FindCollectionByNameOrId("notifications")
	if err != nil {
		return err
	}

	for _, user := range users {
		notification := core.NewRecord(notificationsCollection)
		notification.Set("userId", user.Id)
		notification.Set("subject", subject)
		notification.Set("text", text)
		notification.Set("message", message)
		notification.Set("expiry", expiry)
		notification.Set("sender", sender)
		notification.Set("read", false)

		if err := e.App.Save(notification); err != nil {
			logger.Error("Save error", "userId", user.Id, "announcementId", announcement.Id, "error", err)
		}
	}

	return nil
}
