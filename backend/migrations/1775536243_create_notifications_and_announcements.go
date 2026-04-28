package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		// 1. Create notifications collection
		notifications := core.NewBaseCollection("notifications")
		notifications.Fields.Add(
			&core.RelationField{
				Name:          "userId",
				CollectionId:  users.Id,
				CascadeDelete: true,
				Required:      true,
				MaxSelect:     1,
			},
			&core.TextField{
				Name:     "subject",
				Required: true,
			},
			&core.TextField{
				Name: "text",
			},
			&core.TextField{
				Name: "message",
			},
			&core.DateField{
				Name: "expiry",
			},
			&core.TextField{
				Name: "sender",
			},
			&core.BoolField{
				Name: "read",
			},
		)
		notifications.ListRule = types.Pointer("userId = @request.auth.id")
		notifications.ViewRule = types.Pointer("userId = @request.auth.id")
		notifications.UpdateRule = types.Pointer("userId = @request.auth.id")
		notifications.DeleteRule = types.Pointer("userId = @request.auth.id")
		notifications.CreateRule = types.Pointer("userId = @request.auth.id") // Users can create notifications for themselves? Or maybe only system?
		// Better to allow admin to create for anyone.
		// System sender will be handled by backend.

		if err := app.Save(notifications); err != nil {
			return err
		}

		// 3. Create announcements collection
		announcements := core.NewBaseCollection("announcements")
		announcements.Fields.Add(
			&core.TextField{
				Name:     "subject",
				Required: true,
			},
			&core.TextField{
				Name: "text",
			},
			&core.TextField{
				Name: "message",
			},
			&core.DateField{
				Name: "expiry",
			},
			&core.TextField{
				Name: "sender",
			},
		)
		// Only admins can manage announcements, everyone can view
		announcements.ListRule = types.Pointer("@request.auth.id != ''")
		announcements.ViewRule = types.Pointer("@request.auth.id != ''")
		// announcements.CreateRule, UpdateRule, DeleteRule are empty (only superusers)

		if err := app.Save(announcements); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// Rollback
		notifications, _ := app.FindCollectionByNameOrId("notifications")
		if notifications != nil {
			app.Delete(notifications)
		}

		announcements, _ := app.FindCollectionByNameOrId("announcements")
		if announcements != nil {
			app.Delete(announcements)
		}

		users, _ := app.FindCollectionByNameOrId("users")
		if users != nil {
			users.Fields.RemoveByName("lastLogin")
			app.Save(users)
		}

		return nil
	})
}
