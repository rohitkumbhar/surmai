package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		invitations, _ := app.FindCollectionByNameOrId("invitations")
		invitations.ListRule = types.Pointer("recipientEmail = @request.auth.email:lower")
		invitations.ViewRule = types.Pointer("recipientEmail = @request.auth.email:lower")
		invitations.UpdateRule = types.Pointer("recipientEmail = @request.auth.email:lower")

		return app.Save(invitations)
	}, func(app core.App) error {
		return nil
	})
}
