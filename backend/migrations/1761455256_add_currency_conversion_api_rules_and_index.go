package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...
		currencyConversions, _ := app.FindCollectionByNameOrId("currency_conversions")
		currencyConversions.ListRule = types.Pointer("")
		currencyConversions.ViewRule = types.Pointer("")
		currencyConversions.AddIndex("idx_currency_code", true, "currencyCode", "")

		app.Save(currencyConversions)
		return nil
	}, func(app core.App) error {
		return nil
	})
}
