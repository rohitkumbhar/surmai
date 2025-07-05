package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		endDate := activities.Fields.GetByName("endDate")
		if endDate == nil {
			activities.Fields.Add(
				&core.DateField{
					Name:     "endDate",
					Required: false,
				})
		}

		return app.Save(activities)
	}, func(app core.App) error {

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		endDate := activities.Fields.GetByName("endDate")
		if endDate != nil {
			activities.Fields.RemoveByName("endDate")
		}

		return nil
	})
}
