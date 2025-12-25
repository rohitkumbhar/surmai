package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}

		field := collection.Fields.GetByName("type")
		if selectField, ok := field.(*core.SelectField); ok {
			selectField.Values = append(selectField.Values, "bike")
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}

		field := collection.Fields.GetByName("type")
		if selectField, ok := field.(*core.SelectField); ok {
			newValues := []string{}
			for _, v := range selectField.Values {
				if v != "bike" {
					newValues = append(newValues, v)
				}
			}
			selectField.Values = newValues
		}

		return app.Save(collection)
	})
}
