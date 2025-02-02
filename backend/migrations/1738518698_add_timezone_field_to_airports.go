package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		airports, err := app.FindCollectionByNameOrId("airports")
		if err != nil {
			return err
		}

		timezone := airports.Fields.GetByName("timezone")
		if timezone == nil {
			airports.Fields.Add(
				&core.TextField{
					Name: "timezone",
				})
		}

		return app.Save(airports)
	}, func(app core.App) error {

		airports, err := app.FindCollectionByNameOrId("airports")
		if err != nil {
			return err
		}

		timezone := airports.Fields.GetByName("timezone")
		if timezone != nil {
			airports.Fields.RemoveByName("timezone")
		}

		return nil
	})
}
