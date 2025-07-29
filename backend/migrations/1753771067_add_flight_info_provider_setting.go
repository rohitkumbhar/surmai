package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		settingCollection, _ := app.FindCollectionByNameOrId("surmai_settings")
		record := core.NewRecord(settingCollection)
		record.Set("id", "flight_info_provider")
		record.Set("value", map[string]interface{}{
			"enabled": false,
		})
		return app.Save(record)
	}, func(app core.App) error {
		return nil
	})
}
