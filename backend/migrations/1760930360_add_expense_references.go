package migrations

import (
	bt "backend/types"
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Get collections
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}

		transportations, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}

		lodgings, err := app.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return err
		}

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		// Step 1: Add expenseId field to transportations, lodgings, and activities
		if transportations.Fields.GetByName("expenseId") == nil {
			transportations.Fields.Add(
				&core.RelationField{
					Name:          "expenseId",
					CollectionId:  expenses.Id,
					CascadeDelete: false,
					MaxSelect:     1,
					Required:      false,
				},
			)
			if err := app.Save(transportations); err != nil {
				return err
			}
		}

		if lodgings.Fields.GetByName("expenseId") == nil {
			lodgings.Fields.Add(
				&core.RelationField{
					Name:          "expenseId",
					CollectionId:  expenses.Id,
					CascadeDelete: false,
					MaxSelect:     1,
					Required:      false,
				},
			)
			if err := app.Save(lodgings); err != nil {
				return err
			}
		}

		if activities.Fields.GetByName("expenseId") == nil {
			activities.Fields.Add(
				&core.RelationField{
					Name:          "expenseId",
					CollectionId:  expenses.Id,
					CascadeDelete: false,
					MaxSelect:     1,
					Required:      false,
				},
			)
			if err := app.Save(activities); err != nil {
				return err
			}
		}

		// Step 2: Truncate trip_expenses table
		allExpenses, err := app.FindAllRecords("trip_expenses")
		if err != nil {
			return err
		}
		for _, exp := range allExpenses {
			if err := app.Delete(exp); err != nil {
				return err
			}
		}

		// Step 3: Migrate costs from transportations with category
		if err := migrateCostsWithExpenseRef(app, expenses, transportations, "transportation", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Transportation: %s -> %s", r.GetString("origin"), r.GetString("destination"))
			dateField := "departureTime"
			return name, dateField
		}); err != nil {
			return err
		}

		// Step 3: Migrate costs from lodgings with category
		if err := migrateCostsWithExpenseRef(app, expenses, lodgings, "lodging", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Lodging: %s", r.GetString("name"))
			dateField := "startDate"
			return name, dateField
		}); err != nil {
			return err
		}

		// Step 3: Migrate costs from activities with category
		if err := migrateCostsWithExpenseRef(app, expenses, activities, "activities", func(r *core.Record) (string, string) {
			name := fmt.Sprintf("Activity: %s", r.GetString("name"))
			dateField := "startDate"
			return name, dateField
		}); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// Rollback: Remove expenseId fields
		transportations, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}
		transportations.Fields.RemoveByName("expenseId")
		if err := app.Save(transportations); err != nil {
			return err
		}

		lodgings, err := app.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return err
		}
		lodgings.Fields.RemoveByName("expenseId")
		if err := app.Save(lodgings); err != nil {
			return err
		}

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}
		activities.Fields.RemoveByName("expenseId")
		if err := app.Save(activities); err != nil {
			return err
		}

		return nil
	})
}

func migrateCostsWithExpenseRef(app core.App, expensesCollection *core.Collection, sourceCollection *core.Collection, category string, buildNameAndDateField func(*core.Record) (string, string)) error {
	records, err := app.FindAllRecords(sourceCollection.Name)
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

		// Create expense record
		exp := core.NewRecord(expensesCollection)
		name, dateField := buildNameAndDateField(r)
		exp.Set("name", name)
		exp.Set("trip", r.GetString("trip"))
		exp.Set("cost", map[string]any{
			"value":    cost.Value,
			"currency": cost.Currency,
		})
		exp.Set("category", category)
		
		// Copy first available date field as occurredOn
		if dateField != "" {
			exp.Set("occurredOn", r.Get(dateField))
		}

		if err := app.Save(exp); err != nil {
			return err
		}

		// Update source record with expenseId
		r.Set("expenseId", exp.Id)
		if err := app.Save(r); err != nil {
			return err
		}
	}
	return nil
}
