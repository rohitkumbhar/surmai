package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		transportations, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}

		link := transportations.Fields.GetByName("link")
		if link == nil {
			transportations.Fields.Add(
				&core.EditorField{
					Name:     "link",
					Required: false,
				})
		}

		return app.Save(transportations)

	}, func(app core.App) error {
		transportations, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}
		transportations.Fields.RemoveByName("link")
		return nil
	})
}
