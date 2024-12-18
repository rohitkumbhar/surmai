package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		users.ListRule = types.Pointer("")
		users.ViewRule = types.Pointer("")

		return app.Save(users)
	}, func(app core.App) error {

		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		users.ListRule = nil
		users.ViewRule = nil

		return app.Save(users)
	})
}
