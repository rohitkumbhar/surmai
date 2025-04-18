package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...

		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		// only admins can list all users
		users.ListRule = nil

		// only admins can delete a user
		users.DeleteRule = nil

		// user can view and update self
		users.ViewRule = types.Pointer("id = @request.auth.id")
		users.UpdateRule = types.Pointer("id = @request.auth.id")

		return app.Save(users)

	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
