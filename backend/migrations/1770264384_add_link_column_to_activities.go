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

		link := activities.Fields.GetByName("link")
		if link == nil {
			activities.Fields.Add(
				&core.EditorField{
					Name:     "link",
					Required: false,
				})
		}

		return app.Save(activities)

	}, func(app core.App) error {
		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}
		activities.Fields.RemoveByName("link")
		return nil
	})
}
