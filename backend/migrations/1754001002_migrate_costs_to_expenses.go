package migrations

import (
	bt "backend/types"
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}

		// transportations
		if err := migrateCostsFromCollection(app, expenses, "transportations", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Transportation: %s -> %s", r.GetString("origin"), r.GetString("destination"))
			dateField := "departureTime"
			return name, dateField
		}); err != nil {
			return err
		}

		// lodgings
		if err := migrateCostsFromCollection(app, expenses, "lodgings", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Lodging: %s", r.GetString("name"))
			dateField := "startDate"
			return name, dateField
		}); err != nil {
			return err
		}

		// activities
		if err := migrateCostsFromCollection(app, expenses, "activities", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Activity: %s", r.GetString("name"))
			dateField := "startDate"
			return name, dateField
		}); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// no down migration; data-only migration
		return nil
	})
}

func migrateCostsFromCollection(app core.App, expensesCollection *core.Collection, collectionName string, buildNameAndDateField func(*core.Record) (string, string)) error {
	records, err := app.FindAllRecords(collectionName)
	if err != nil {
		return err
	}

	for _, r := range records {
		var cost *bt.Cost
		_ = r.UnmarshalJSONField("cost", &cost)
		if cost == nil {
			continue
		}
		if cost.Value == 0 {
			continue
		}

		exp := core.NewRecord(expensesCollection)
		name, dateField := buildNameAndDateField(r)
		exp.Set("name", name)
		exp.Set("trip", r.GetString("trip"))
		exp.Set("cost", map[string]any{
			"value":    cost.Value,
			"currency": cost.Currency,
		})
		// copy first available date field as occurredOn
		if dateField != "" {
			exp.Set("occurredOn", r.Get(""+dateField+""))
		}

		if err := app.Save(exp); err != nil {
			return err
		}
	}
	return nil
}
