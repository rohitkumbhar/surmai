package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...

		trips, _ := app.FindCollectionByNameOrId("trips")
		trips.ListRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id || travellers.email ?= @request.auth.email")
		trips.ViewRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id || travellers.email ?= @request.auth.email")
		err := app.Save(trips)

		if err != nil {
			return err
		}

		transportations, _ := app.FindCollectionByNameOrId("transportations")
		transportations.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")
		transportations.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")

		err = app.Save(transportations)
		if err != nil {
			return err
		}

		lodgings, _ := app.FindCollectionByNameOrId("lodgings")
		lodgings.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")
		lodgings.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")

		err = app.Save(lodgings)
		if err != nil {
			return err
		}

		activities, _ := app.FindCollectionByNameOrId("activities")
		activities.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")
		activities.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")

		err = app.Save(activities)
		if err != nil {
			return err
		}

		attachments, _ := app.FindCollectionByNameOrId("trip_attachments")
		attachments.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")
		attachments.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")

		err = app.Save(attachments)
		if err != nil {
			return err
		}

		expenses, _ := app.FindCollectionByNameOrId("trip_expenses")
		expenses.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")
		expenses.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id || trip.travellers.email ?= @request.auth.email")

		err = app.Save(expenses)

		return nil
	}, func(app core.App) error {
		// add down queries...

		trips, _ := app.FindCollectionByNameOrId("trips")
		trips.ListRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")
		trips.ViewRule = types.Pointer("ownerId = @request.auth.id || collaborators.id ?= @request.auth.id")
		err := app.Save(trips)

		if err != nil {
			return err
		}

		transportations, _ := app.FindCollectionByNameOrId("transportations")
		transportations.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		transportations.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		err = app.Save(transportations)
		if err != nil {
			return err
		}

		lodgings, _ := app.FindCollectionByNameOrId("lodgings")
		lodgings.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		lodgings.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		err = app.Save(lodgings)
		if err != nil {
			return err
		}

		activities, _ := app.FindCollectionByNameOrId("activities")
		activities.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		activities.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		err = app.Save(activities)
		if err != nil {
			return err
		}

		attachments, _ := app.FindCollectionByNameOrId("trip_attachments")
		attachments.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		attachments.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		err = app.Save(attachments)
		if err != nil {
			return err
		}

		expenses, _ := app.FindCollectionByNameOrId("trip_expenses")
		expenses.ListRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")
		expenses.ViewRule = types.Pointer("trip.ownerId = @request.auth.id || trip.collaborators.id ?= @request.auth.id")

		err = app.Save(expenses)

		return nil
	})
}
