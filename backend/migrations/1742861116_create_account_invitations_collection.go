package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		accountInvitations, _ := app.FindCollectionByNameOrId("account_invitations")
		if accountInvitations != nil {
			return nil
		}

		collection := core.NewBaseCollection("account_invitations")
		collection.Fields.Add(
			&core.TextField{
				Name:     "recipientEmail",
				Required: true,
			},
			&core.TextField{
				Name:     "fromId",
				Required: true,
			},
			&core.TextField{
				Name:     "invitationCode",
				Required: true,
			},
			&core.TextField{
				Name:     "message",
				Required: true,
			},
			&core.AutodateField{
				Name:     "created",
				OnCreate: true,
				OnUpdate: false,
			},
			&core.AutodateField{
				Name:     "updated",
				OnCreate: true,
				OnUpdate: true,
			},
		)

		collection.AddIndex("idx_recipient_email", false, "recipientEmail,fromId", "")
		collection.AddIndex("idx_code", false, "invitationCode", "")

		return app.Save(collection)

	}, func(app core.App) error {

		airports, err := app.FindCollectionByNameOrId("account_invitations")
		if err != nil {
			return err
		}

		return app.Delete(airports)
	})
}
