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

		// add category field if not already present
		if expenses.Fields.GetByName("category") == nil {
			expenses.Fields.Add(
				&core.TextField{
					Name:     "category",
					Required: false,
				},
			)
		}

		return app.Save(expenses)
	}, func(app core.App) error {
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}
		expenses.Fields.RemoveByName("category")
		return app.Save(expenses)
	})
}
