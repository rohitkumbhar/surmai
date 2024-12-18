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

		users.Fields.Add(
			&core.TextField{
				Name: "colorScheme",
			},
			&core.TextField{
				Name: "currencyCode",
			})

		return app.Save(users)
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
