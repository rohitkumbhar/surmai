package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		collectionId, _ := app.FindCollectionByNameOrId("traveller_profiles")
		if collectionId != nil {
			return nil
		}

		travellers := core.NewBaseCollection("traveller_profiles")

		travellers.Fields.Add(
			&core.EmailField{
				Name:     "email",
				Required: true,
			},
			&core.TextField{
				Name:     "legalName",
				Required: true,
			},
			&core.TextField{
				Name: "passportId",
			},
			&core.TextField{
				Name: "knownTravellerNumber",
			},
			&core.RelationField{
				Name:          "ownerId",
				CollectionId:  "_pb_users_auth_",
				MaxSelect:     1,
				Required:      false,
				CascadeDelete: false,
			},
			&core.RelationField{
				Name:          "managers",
				CollectionId:  "_pb_users_auth_",
				MaxSelect:     999,
				Required:      false,
				CascadeDelete: false,
			},
			&core.FileField{
				Name:      "attachments",
				MaxSelect: 99,
				MaxSize:   10 * 1024 * 1024, // 10MB
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

		travellers.AddIndex("tp_email_uidx", true, "email", "")

		// List & View Rule: Only owners and managers can view.
		// Also allow people who can view the trips it is assigned to?
		// Requirement says: "Can be assigned to trips but only by the owner or managers."
		// For now: Owner, managers, or if the email matches the authenticated user.
		travellers.ListRule = types.Pointer("ownerId = @request.auth.id || managers.id ?= @request.auth.id || email = @request.auth.email")
		travellers.ViewRule = types.Pointer("ownerId = @request.auth.id || managers.id ?= @request.auth.id || email = @request.auth.email")

		// Create Rule: Any authenticated user can create a profile?
		// Usually yes, if they want to create their own or others.
		travellers.CreateRule = types.Pointer("@request.auth.id != \"\"")

		// Update Rule: Only owner and managers.
		travellers.UpdateRule = types.Pointer("ownerId = @request.auth.id || managers.id ?= @request.auth.id")

		// Delete Rule: Only owner.
		travellers.DeleteRule = types.Pointer("ownerId = @request.auth.id")

		return app.Save(travellers)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("traveller_profiles")
		if err != nil {
			return err
		}
		return app.Delete(collection)
	})
}
