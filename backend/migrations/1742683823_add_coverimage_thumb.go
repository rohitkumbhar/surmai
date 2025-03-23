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

		coverImageField := trips.Fields.GetByName("coverImage").(*core.FileField)
		coverImageField.Thumbs = []string{"1920x800", "300x125", "300x0"}
		return app.Save(trips)
	}, func(app core.App) error {

		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}

		coverImageField := trips.Fields.GetByName("coverImage").(*core.FileField)
		coverImageField.Thumbs = []string{"1920x800"}
		return app.Save(trips)
	})
}
