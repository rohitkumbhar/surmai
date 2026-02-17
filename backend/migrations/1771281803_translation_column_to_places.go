package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		places, err := app.FindCollectionByNameOrId("places")
		if err != nil {
			return err
		}

		translations := places.Fields.GetByName("translations")
		if translations == nil {
			places.Fields.Add(
				&core.JSONField{
					Name:     "translations",
					Required: false,
				})
		}

		return app.Save(places)

	}, func(app core.App) error {
		places, err := app.FindCollectionByNameOrId("places")
		if err != nil {
			return err
		}
		places.Fields.RemoveByName("translations")
		return nil
	})
}
