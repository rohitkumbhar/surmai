package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// 1. Add created and updated fields to announcements collection
		announcements, err := app.FindCollectionByNameOrId("announcements")
		if err != nil {
			return err
		}

		if announcements.Fields.GetByName("created") == nil {
			announcements.Fields.Add(&core.AutodateField{
				Name:     "created",
				OnCreate: true,
				OnUpdate: false,
			})
		}
		if announcements.Fields.GetByName("updated") == nil {
			announcements.Fields.Add(&core.AutodateField{
				Name:     "updated",
				OnCreate: true,
				OnUpdate: true,
			})
		}
		if err := app.Save(announcements); err != nil {
			return err
		}

		// 2. Add created and updated fields to notifications collection
		notifications, err := app.FindCollectionByNameOrId("notifications")
		if err != nil {
			return err
		}

		if notifications.Fields.GetByName("created") == nil {
			notifications.Fields.Add(&core.AutodateField{
				Name:     "created",
				OnCreate: true,
				OnUpdate: false,
			})
		}
		if notifications.Fields.GetByName("updated") == nil {
			notifications.Fields.Add(&core.AutodateField{
				Name:     "updated",
				OnCreate: true,
				OnUpdate: true,
			})
		}
		if err := app.Save(notifications); err != nil {
			return err
		}

		return nil
	}, nil)
}
