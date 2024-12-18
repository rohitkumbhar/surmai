package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"os"
)

func init() {
	m.Register(func(app core.App) error {

		superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
		if err != nil {
			return err
		}

		adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
		adminPassword := os.Getenv("SURMAI_ADMIN_PASSWORD")

		record := core.NewRecord(superusers)
		record.Set("email", adminEmail)
		record.Set("password", adminPassword)
		return app.Save(record)

	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
