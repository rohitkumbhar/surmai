package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("traveller_profiles")
		if err != nil {
			return err
		}

		// Remove knownTravellerNumber field
		ktnField := collection.Fields.GetByName("knownTravellerNumber")
		if ktnField != nil {
			collection.Fields.RemoveById(ktnField.GetId())
		}

		// Add additionalFields JSON column
		collection.Fields.Add(
			&core.JSONField{
				Name:     "additionalFields",
				Required: false,
			},
		)

		return app.Save(collection)
	}, func(app core.App) error {
		// Revert: remove additionalFields and restore knownTravellerNumber
		collection, err := app.FindCollectionByNameOrId("traveller_profiles")
		if err != nil {
			return err
		}

		// Remove additionalFields field
		afField := collection.Fields.GetByName("additionalFields")
		if afField != nil {
			collection.Fields.RemoveById(afField.GetId())
		}

		// Restore knownTravellerNumber field
		collection.Fields.Add(
			&core.TextField{
				Name: "knownTravellerNumber",
			},
		)

		return app.Save(collection)
	})
}
