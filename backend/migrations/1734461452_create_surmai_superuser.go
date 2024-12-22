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

		_, err = app.FindAuthRecordByEmail(superusers, adminEmail)

		// Create only if the user doesn't exist
		if err != nil {
			record := core.NewRecord(superusers)
			record.Set("email", adminEmail)
			record.Set("password", adminPassword)
			return app.Save(record)
		}

		return nil

	}, func(app core.App) error {
		adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
		record, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, adminEmail)
		if record == nil {
			return nil // probably already deleted
		}

		return app.Delete(record)
	})
}
