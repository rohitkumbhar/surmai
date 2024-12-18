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

		lodgings := core.NewBaseCollection("lodgings")
		lodgings.Fields.Add(
			&core.SelectField{
				Name:      "type",
				Values:    []string{"hotel", "home", "vacation_rental", "camp_site"},
				MaxSelect: 1,
				Required:  true,
			},
			&core.TextField{
				Name:     "name",
				Required: true,
			},
			&core.TextField{
				Name:     "address",
				Required: true,
			},
			&core.DateField{
				Name:     "startDate",
				Required: true,
			},
			&core.DateField{
				Name:     "endDate",
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

		lodgings.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		lodgings.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		lodgings.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		lodgings.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")
		lodgings.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id = @request.auth.id")

		lodgings.AddIndex("idx_lodgings_trip", false, "trip", "")

		return app.Save(lodgings)
	}, func(app core.App) error {
		lodgings, err := app.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return err
		}

		return app.Delete(lodgings)
	})
}
