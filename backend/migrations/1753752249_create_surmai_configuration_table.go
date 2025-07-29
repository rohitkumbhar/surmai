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
				Name:       "id",
				Required:   true,
				PrimaryKey: true,
				Pattern:    "^[a-z0-9_]+$",
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

		return app.Save(surmaiSettings)

	}, func(app core.App) error {

		places, err := app.FindCollectionByNameOrId("surmai_settings")
		if err != nil {
			return err
		}

		return app.Delete(places)
	})
}
