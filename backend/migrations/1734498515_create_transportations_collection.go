package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		collectionId, _ := app.FindCollectionByNameOrId("transportations")
		if collectionId != nil {
			return nil
		}

		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}
		tripsCollectionId := trips.Id

		transportations := core.NewBaseCollection("transportations")
		transportations.Fields.Add(
			&core.SelectField{
				Name:      "type",
				Values:    []string{"flight", "car", "bus", "boat", "train", "rental_car"},
				MaxSelect: 1,
				Required:  true,
			},
			&core.TextField{
				Name:     "origin",
				Required: true,
			},
			&core.TextField{
				Name:     "destination",
				Required: true,
			},
			&core.DateField{
				Name:     "departureTime",
				Required: true,
			},
			&core.DateField{
				Name:     "arrivalTime",
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
			&core.JSONField{
				Name:    "metadata",
				MaxSize: 1000,
			},
			&core.JSONField{
				Name:    "cost",
				MaxSize: 10000,
			},
			&core.RelationField{
				Name:          "trip",
				CollectionId:  tripsCollectionId,
				CascadeDelete: true,
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

		transportations.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		transportations.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		transportations.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		transportations.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		transportations.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")

		transportations.AddIndex("idx_trip", false, "trip", "")

		return app.Save(transportations)
	}, func(app core.App) error {
		transportations, err := app.FindCollectionByNameOrId("transportations")
		if err != nil {
			return err
		}

		return app.Delete(transportations)
	})
}
