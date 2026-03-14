package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}

		if expenses.Fields.GetByName("splits") == nil {
			expenses.Fields.Add(
				&core.JSONField{
					Name:    "splits",
					MaxSize: 50000,
				},
			)
		}

		return app.Save(expenses)
	}, func(app core.App) error {
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}
		expenses.Fields.RemoveByName("splits")
		return app.Save(expenses)
	})
}
