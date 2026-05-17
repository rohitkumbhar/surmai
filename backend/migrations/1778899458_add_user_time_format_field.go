package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		timeFormat := users.Fields.GetByName("timeFormat")
		if timeFormat == nil {
			users.Fields.Add(
				&core.TextField{
					Name: "timeFormat",
				})
		}

		return app.Save(users)

	}, func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		users.Fields.RemoveByName("timeFormat")
		return nil
	})
}
