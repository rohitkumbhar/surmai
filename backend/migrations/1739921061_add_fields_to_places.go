package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		places, err := app.FindCollectionByNameOrId("places")
		if err != nil {
			return err
		}

		timezone := places.Fields.GetByName("timezone")
		if timezone == nil {
			places.Fields.Add(
				&core.TextField{
					Name: "timezone",
				})
		}

		asciiName := places.Fields.GetByName("asciiName")
		if asciiName == nil {
			places.Fields.Add(
				&core.TextField{
					Name: "asciiName",
				})
		}

		return app.Save(places)
	}, func(app core.App) error {

		places, err := app.FindCollectionByNameOrId("places")
		if err != nil {
			return err
		}

		timezone := places.Fields.GetByName("timezone")
		if timezone != nil {
			places.Fields.RemoveByName("timezone")
		}

		asciiName := places.Fields.GetByName("asciiName")
		if asciiName != nil {
			places.Fields.RemoveByName("asciiName")
		}

		return nil
	})
}
