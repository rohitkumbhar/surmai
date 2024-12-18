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

		activities := core.NewBaseCollection("activities")
		activities.Fields.Add(

			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "description",
				Required: false,
			},
			&core.TextField{
				Name:     "address",
				Required: false,
			},
			&core.DateField{
				Name:     "startDate",
				Required: true,
			},

			&core.JSONField{
				Name:    "metadata",
				MaxSize: 1000,
			},
			&core.JSONField{
				Name:    "cost",
				MaxSize: 10000,
			},
			&core.RelationField{
				Name:         "trip",
				CollectionId: tripsCollectionId,
			},
			&core.TextField{
				Name: "confirmationCode",
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
			&core.FileField{
				Name:      "attachments",
				MaxSize:   5242880,
				MaxSelect: 99,
				MimeTypes: []string{"application/pdf",
					"text/plain",
					"text/html",
					"image/png",
					"image/jpeg",
					"image/gif",
					"image/webp"},
			},
		)

		activities.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		activities.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		activities.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		activities.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		activities.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")

		activities.AddIndex("idx_activities_trip", false, "trip", "")

		return app.Save(activities)
	}, func(app core.App) error {
		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		return app.Delete(activities)
	})
}
