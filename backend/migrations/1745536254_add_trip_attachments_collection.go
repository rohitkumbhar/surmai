package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		tripsCollectionId := trips.Id

		attachments := core.NewBaseCollection("trip_attachments")
		attachments.Fields.Add(
			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.RelationField{
				Name:          "trip",
				CollectionId:  tripsCollectionId,
				CascadeDelete: true,
			},
			&core.FileField{
				Name:      "file",
				MaxSize:   5242880,
				MaxSelect: 1,
				MimeTypes: []string{
					"application/pdf",
					"text/plain",
					"text/html",
					"image/png",
					"image/jpeg",
					"image/gif",
					"image/webp"},
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

		attachments.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.AddIndex("idx_attachments_trip", false, "trip", "")

		return app.Save(attachments)
	}, func(app core.App) error {
		attachments, err := app.FindCollectionByNameOrId("trip_attachments")
		if err != nil {
			return err
		}
		return app.Delete(attachments)
	})
}
