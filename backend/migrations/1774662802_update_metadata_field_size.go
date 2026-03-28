package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		collectionNames := []string{"transportations", "lodgings", "activities"}

		for _, name := range collectionNames {
			collection, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}

			metadataField := collection.Fields.GetByName("metadata").(*core.JSONField)
			metadataField.MaxSize = 10000

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		collectionNames := []string{"transportations", "lodgings", "activities"}

		for _, name := range collectionNames {
			collection, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}

			metadataField := collection.Fields.GetByName("metadata").(*core.JSONField)
			metadataField.MaxSize = 1000

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	})
}
