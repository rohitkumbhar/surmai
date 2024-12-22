package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		collectionId, _ := app.FindCollectionByNameOrId("trips")
		if collectionId != nil {
			return nil
		}

		trips := core.NewBaseCollection("trips")

		trips.Fields.Add(
			&core.TextField{
				Name:     "name",
				Required: true,
				Max:      100,
				Min:      1,
			},
			&core.TextField{
				Name:     "description",
				Required: false,
			},
			&core.DateField{
				Name:     "startDate",
				Required: true,
			},
			&core.DateField{
				Name:     "endDate",
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
			&core.RelationField{
				Name:          "ownerId",
				Presentable:   true,
				CollectionId:  "_pb_users_auth_",
				CascadeDelete: true,
				Required:      true,
				MaxSelect:     1,
			},
			&core.FileField{
				Name:        "coverImage",
				Id:          "",
				System:      false,
				Hidden:      false,
				Presentable: false,
				MaxSize:     0,
				MaxSelect:   0,
				MimeTypes:   []string{"image/png", "image/jpeg", "image/webp"},
				Thumbs:      []string{"1920x800"},
			},
			&core.JSONField{
				Name:     "participants",
				MaxSize:  1000,
				Required: false,
			},
			&core.JSONField{
				Name:     "destinations",
				MaxSize:  10000,
				Required: false,
			},
			&core.RelationField{
				Name:          "collaborators",
				Id:            "",
				System:        false,
				Hidden:        false,
				Presentable:   false,
				CollectionId:  "_pb_users_auth_",
				CascadeDelete: false,
				MinSelect:     0,
				MaxSelect:     999,
				Required:      false,
			},
		)

		// Only owner and collaborators of the trip can modify or delete trips
		trips.ListRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")
		trips.ViewRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")
		trips.UpdateRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")
		trips.DeleteRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")

		// Any authenticated user can create a trip
		trips.CreateRule = types.Pointer("")

		return app.Save(trips)
	}, func(app core.App) error {
		trips, err := app.FindCollectionByNameOrId("trips")
		if err != nil {
			return err
		}

		return app.Delete(trips)
	})
}
