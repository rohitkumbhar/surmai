package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		lodgings, err := app.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return err
		}

		link := lodgings.Fields.GetByName("link")
		if link == nil {
			lodgings.Fields.Add(
				&core.EditorField{
					Name:     "link",
					Required: false,
				})
		}

		return app.Save(lodgings)

	}, func(app core.App) error {
		lodgings, err := app.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return err
		}
		lodgings.Fields.RemoveByName("link")
		return nil
	})
}
