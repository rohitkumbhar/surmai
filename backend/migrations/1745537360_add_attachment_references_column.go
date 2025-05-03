package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		attachments, _ := app.FindCollectionByNameOrId("trip_attachments")

		err := addAttachmentReferencesCol(app, "transportations", attachments)
		if err != nil {
			return err
		}

		err = addAttachmentReferencesCol(app, "lodgings", attachments)
		if err != nil {
			return err
		}

		err = addAttachmentReferencesCol(app, "activities", attachments)
		if err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		removeAttachmentReferencesCol(app, "transportations")
		removeAttachmentReferencesCol(app, "lodgings")
		removeAttachmentReferencesCol(app, "activities")
		return nil
	})
}

func addAttachmentReferencesCol(app core.App, collectionName string, attachments *core.Collection) error {
	collection, err := app.FindCollectionByNameOrId(collectionName)
	if err != nil {
		return err
	}
	collection.Fields.Add(
		&core.RelationField{
			Name:          "attachmentReferences",
			CollectionId:  attachments.Id,
			CascadeDelete: false, // we want this record to persist even if the attachment gets deleted
			MaxSelect:     100,
			MinSelect:     0,
		})

	return app.Save(collection)
}

func removeAttachmentReferencesCol(app core.App, collectionName string) {
	collection, _ := app.FindCollectionByNameOrId(collectionName)
	collection.Fields.RemoveByName("attachmentReferences")
	_ = app.Save(collection)
}
