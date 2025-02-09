package migrations

import (
	bt "backend/types"
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
		usersCollectionId := users.Id

		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		tripsCollectionId := trips.Id

		collectionId, _ := app.FindCollectionByNameOrId("invitations")
		if collectionId != nil {
			return nil
		}

		invitations := core.NewBaseCollection("invitations")
		invitations.Fields.Add(
			&core.TextField{
				Name:     "message",
				Required: false,
			},
			&core.RelationField{
				Name:          "from",
				CollectionId:  usersCollectionId,
				CascadeDelete: true,
			},
			&core.TextField{
				Name:     "recipientEmail",
				Required: true,
			},
			&core.SelectField{
				Name:      "status",
				Values:    []string{bt.Open.String(), bt.Accepted.String(), bt.Rejected.String(), bt.Expired.String()},
				MaxSelect: 1,
				Required:  true,
			},
			&core.DateField{
				Name: "expiresOn",
			},
			&core.RelationField{
				Name:          "trip",
				CollectionId:  tripsCollectionId,
				CascadeDelete: true,
			},
			&core.JSONField{
				Name:     "metadata",
				MaxSize:  10000,
				Required: false,
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

		// Any authenticated user can create an invitation
		invitations.CreateRule = types.Pointer("")

		// only a recipient can see and update their invitations
		invitations.ListRule = types.Pointer("recipientEmail = @request.auth.email")
		invitations.ViewRule = types.Pointer("recipientEmail = @request.auth.email")
		invitations.UpdateRule = types.Pointer("recipientEmail = @request.auth.email")

		invitations.AddIndex("idx_inv_rec_email_trip", true, "trip,recipientEmail", "")
		invitations.AddIndex("idx_invitations_recipient", false, "recipientEmail", "")
		invitations.AddIndex("idx_invitations_status", false, "status", "")
		return app.Save(invitations)
	}, func(app core.App) error {
		invitations, err := app.FindCollectionByNameOrId("invitations")
		if err != nil {
			return err
		}

		return app.Delete(invitations)
	})
}
