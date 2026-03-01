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

		travellerProfilesCollection, _ := app.FindCollectionByNameOrId("traveller_profiles")

		trips.Fields.Add(
			&core.RelationField{
				Name:          "travellers",
				CollectionId:  travellerProfilesCollection.Id,
				MaxSelect:     999,
				Required:      false,
				CascadeDelete: false,
			},
		)

		return app.Save(trips)
	}, func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		trips.Fields.RemoveByName("travellers")
		return app.Save(trips)
	})
}
