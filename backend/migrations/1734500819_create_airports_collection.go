package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		collectionId, _ := app.FindCollectionByNameOrId("airports")
		if collectionId != nil {
			return nil
		}

		airports := core.NewBaseCollection("airports")
		airports.Fields.Add(

			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "iataCode",
				Required: false,
			},
			&core.TextField{
				Name:     "isoCountry",
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

		airports.ListRule = types.Pointer("")
		airports.ViewRule = types.Pointer("")

		airports.AddIndex("idx_airports_name", false, "name", "")
		airports.AddIndex("idx_airports_code", false, "iataCode", "")
		return app.Save(airports)

	}, func(app core.App) error {
		airports, err := app.FindCollectionByNameOrId("airports")
		if err != nil {
			return err
		}

		return app.Delete(airports)
	})
}
