package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...

		//create a table for currency data
		// id, currency code, conversion_rate, updated_date
		collectionId, _ := app.FindCollectionByNameOrId("currency_conversions")
		if collectionId != nil {
			return nil
		}

		currencyConversions := core.NewBaseCollection("currency_conversions")
		currencyConversions.Fields.Add(

			&core.TextField{
				Name:     "currencyCode",
				Required: true,
			},
			&core.NumberField{
				Name:     "conversionRate",
				Required: true,
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

		return app.Save(currencyConversions)
	}, func(app core.App) error {
		// add down queries...

		settings, err := app.FindCollectionByNameOrId("currency_conversions")
		if err != nil {
			return err
		}

		return app.Delete(settings)
	})
}
