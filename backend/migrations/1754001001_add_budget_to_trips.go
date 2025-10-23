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

		// add JSON budget field if not already present
		if trips.Fields.GetByName("budget") == nil {
			trips.Fields.Add(
				&core.JSONField{
					Name:    "budget",
					MaxSize: 10000,
				},
			)
		}

		return app.Save(trips)
	}, func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		trips.Fields.RemoveByName("budget")
		return app.Save(trips)
	})
}
