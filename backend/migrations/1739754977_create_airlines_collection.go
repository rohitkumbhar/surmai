package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		collectionId, _ := app.FindCollectionByNameOrId("airlines")
		if collectionId != nil {
			return nil
		}

		airlines := core.NewBaseCollection("airlines")
		airlines.Fields.Add(
			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "code",
				Required: false,
			},
			&core.TextField{
				Name:     "logo",
				Required: false,
			},
		)

		airlines.ListRule = types.Pointer("")
		airlines.ViewRule = types.Pointer("")

		airlines.AddIndex("idx_airlines_name", false, "name", "")
		return app.Save(airlines)
	}, func(app core.App) error {
		airlines, err := app.FindCollectionByNameOrId("airlines")
		if err != nil {
			return err
		}

		return app.Delete(airlines)
	})
}
