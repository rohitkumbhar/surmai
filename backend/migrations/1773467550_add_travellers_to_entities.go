package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		travellerProfilesCollection, err := app.FindCollectionByNameOrId("traveller_profiles")
		if err != nil {
			return err
		}

		collectionNames := []string{"transportations", "lodgings", "activities"}

		for _, name := range collectionNames {
			collection, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}

			collection.Fields.Add(
				&core.RelationField{
					Name:          "travellers",
					CollectionId:  travellerProfilesCollection.Id,
					MaxSelect:     999,
					Required:      false,
					CascadeDelete: false,
				},
			)

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

			collection.Fields.RemoveByName("travellers")

			if err := app.Save(collection); err != nil {
				return err
			}
		}

		return nil
	})
}
