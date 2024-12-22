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

		saveRequired := false

		colorSchemeField := users.Fields.GetByName("colorScheme")
		if colorSchemeField == nil {
			saveRequired = true
			users.Fields.Add(
				&core.TextField{
					Name: "colorScheme",
				})
		}

		currencyCode := users.Fields.GetByName("currencyCode")
		if currencyCode == nil {
			saveRequired = true
			users.Fields.Add(
				&core.TextField{
					Name: "currencyCode",
				})
		}

		if saveRequired {
			return app.Save(users)
		}

		return nil

	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
