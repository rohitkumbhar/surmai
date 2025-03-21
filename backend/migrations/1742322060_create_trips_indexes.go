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

		trips.AddIndex("end_date_idx", false, "endDate", "")
		trips.AddIndex("owner_idx", false, "ownerId", "")
		trips.AddIndex("name_idx", false, "name", "")

		return app.Save(trips)
	}, func(app core.App) error {

		trips, _ := app.FindCollectionByNameOrId("trips")
		if trips == nil {

			return nil
		}
		trips.RemoveIndex("end_date_idx")
		trips.RemoveIndex("owner_idx")
		trips.RemoveIndex("name_idx")

		return app.Save(trips)
	})
}
