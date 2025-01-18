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

		timezone := users.Fields.GetByName("timezone")
		if timezone == nil {
			users.Fields.Add(
				&core.TextField{
					Name: "timezone",
				})
		}

		return app.Save(users)

	}, func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		users.Fields.RemoveByName("timezone")
		return nil
	})
}
