package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		collectionId, _ := app.FindCollectionByNameOrId("surmai_settings")
		if collectionId != nil {
			return nil
		}

		surmaiSettings := core.NewBaseCollection("surmai_settings")
		surmaiSettings.Fields.Add(

			&core.TextField{
				Name:       "key",
				Required:   true,
				PrimaryKey: true,
			},
			&core.JSONField{
				Name:     "value",
				MaxSize:  1000,
				Required: false,
			},
			&core.AutodateField{
				Name:     "created",
				OnCreate: true,
				OnUpdate: false,
			},
			&core.AutodateField{
				Name:     "updated",
				OnCreate: true,
				OnUpdate: true,
			},
		)

		surmaiSettings.AddIndex("idx_key", false, "key", "")
		return app.Save(surmaiSettings)

	}, func(app core.App) error {

		places, err := app.FindCollectionByNameOrId("surmai_settings")
		if err != nil {
			return err
		}

		return app.Delete(places)
	})
}
