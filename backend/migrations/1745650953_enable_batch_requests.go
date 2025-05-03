package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		settings := app.Settings()
		settings.Batch.Enabled = true
		settings.Batch.Timeout = 300
		return app.Save(settings)
	}, func(app core.App) error {
		settings := app.Settings()
		settings.Batch.Enabled = false
		settings.Batch.Timeout = 300
		return app.Save(settings)
	})
}
