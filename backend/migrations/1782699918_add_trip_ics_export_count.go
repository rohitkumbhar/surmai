package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}

		icsExportCount := trips.Fields.GetByName("icsExportCount")
		if icsExportCount == nil {
			trips.Fields.Add(
				&core.NumberField{
					Name: "icsExportCount",
					OnlyInt: true,
				})
		}

		return app.Save(trips)

	}, func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		trips.Fields.RemoveByName("icsExportCount")
		return nil
	})
}
