package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		places := core.NewBaseCollection("places")
		places.Fields.Add(

			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "stateCode",
				Required: false,
			},
			&core.TextField{
				Name:     "stateName",
				Required: false,
			},
			&core.TextField{
				Name:     "countryCode",
				Required: false,
			},
			&core.TextField{
				Name:     "countryName",
				Required: false,
			},
			&core.TextField{
				Name:     "latitude",
				Required: false,
			},
			&core.TextField{
				Name:     "longitude",
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

		places.ListRule = types.Pointer("")
		places.ViewRule = types.Pointer("")

		places.AddIndex("idx_places_name", false, "name", "")
		places.AddIndex("idx_places_combined", true, "`name`,`stateName`,`countryName`", "")
		return app.Save(places)
	}, func(app core.App) error {
		places, err := app.FindCollectionByNameOrId("places")
		if err != nil {
			return err
		}

		return app.Delete(places)
	})
}
