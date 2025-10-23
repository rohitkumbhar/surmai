package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// ensure we don't recreate if exists
		existing, _ := app.FindCollectionByNameOrId("trip_expenses")
		if existing != nil {
			return nil
		}

		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		tripsCollectionId := trips.Id

		attachments, err := app.FindCollectionByNameOrId("trip_attachments")
		if err != nil {
			return err
		}

		expenses := core.NewBaseCollection("trip_expenses")
		expenses.Fields.Add(
			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.RelationField{
				Name:          "trip",
				CollectionId:  tripsCollectionId,
				CascadeDelete: true,
			},
			&core.JSONField{
				Name:    "cost",
				MaxSize: 10000,
			},
			&core.DateField{
				Name:     "occurredOn",
				Required: false,
			},
			&core.TextField{
				Name:     "notes",
				Required: false,
			},
			&core.RelationField{
				Name:          "attachmentReferences",
				CollectionId:  attachments.Id,
				CascadeDelete: false,
				MaxSelect:     100,
				MinSelect:     0,
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

		expenses.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		expenses.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		expenses.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		expenses.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		expenses.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		expenses.AddIndex("idx_expenses_trip", false, "trip", "")
		expenses.AddIndex("idx_expenses_occurredOn", false, "occurredOn", "")

		return app.Save(expenses)
	}, func(app core.App) error {
		expenses, err := app.FindCollectionByNameOrId("trip_expenses")
		if err != nil {
			return err
		}
		return app.Delete(expenses)
	})
}
