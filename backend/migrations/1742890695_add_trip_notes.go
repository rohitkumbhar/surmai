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

		notes := trips.Fields.GetByName("notes")
		if notes == nil {
			trips.Fields.Add(
				&core.EditorField{
					Name:     "notes",
					Required: false,
				})
		}

		return app.Save(trips)

	}, func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		trips.Fields.RemoveByName("notes")
		return nil
	})
}
