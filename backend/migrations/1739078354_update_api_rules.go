package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...

		transportations, _ := app.FindCollectionByNameOrId("transportations")
		transportations.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		transportations.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		transportations.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		transportations.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		transportations.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		err := app.Save(transportations)
		if err != nil {
			return err
		}

		lodgings, _ := app.FindCollectionByNameOrId("lodgings")
		lodgings.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		lodgings.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		lodgings.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		lodgings.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		lodgings.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		err = app.Save(lodgings)
		if err != nil {
			return err
		}

		activities, _ := app.FindCollectionByNameOrId("activities")
		activities.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		activities.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		activities.UpdateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		activities.DeleteRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		activities.CreateRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		err = app.Save(activities)
		if err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
