package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"os"
)

func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
		adminPassword := os.Getenv("SURMAI_ADMIN_PASSWORD")

		_, err = app.FindAuthRecordByEmail(users, adminEmail)

		if err != nil {
			record := core.NewRecord(users)
			record.Set("email", adminEmail)
			record.Set("emailVisibility", true)
			record.Set("password", adminPassword)
			return app.Save(record)
		}
		return nil

	}, func(app core.App) error {
		adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
		record, _ := app.FindAuthRecordByEmail("users", adminEmail)
		if record == nil {
			return nil // probably already deleted
		}

		return app.Delete(record)
	})
}
