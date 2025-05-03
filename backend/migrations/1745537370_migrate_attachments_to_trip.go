package migrations

import (
	a "backend/trips/import/attachments"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func init() {
	m.Register(func(app core.App) error {
		attachmentsCollection, _ := app.FindCollectionByNameOrId("trip_attachments")
		err := migrateCollection(app, attachmentsCollection, "transportations")
		if err != nil {
			return err
		}

		err = migrateCollection(app, attachmentsCollection, "lodgings")
		if err != nil {
			return err
		}

		err = migrateCollection(app, attachmentsCollection, "activities")
		if err != nil {
			return err
		}
		return nil
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}

func migrateCollection(app core.App, attachmentsCollection *core.Collection, collectionName string) error {
	collection, err := app.FindAllRecords(collectionName)
	if err != nil {
		return err
	}

	for _, record := range collection {
		tripId := record.GetString("trip")
		attachments := a.GetAttachmentsForMigration(app, record)
		files, fErr := a.GetFiles(attachments)

		if fErr == nil {
			err2 := migrateAttachments(app, files, attachmentsCollection, tripId, record)
			if err2 != nil {
				return err2
			}
		}
	}
	return nil
}

func migrateAttachments(app core.App, files []*filesystem.File, attachmentsCollection *core.Collection, tripId string, originalRecord *core.Record) error {
	for _, f := range files {
		// create a trip attachment record
		record := core.NewRecord(attachmentsCollection)
		record.Set("trip", tripId)
		record.Set("file", f)
		record.Set("name", a.SanitizeName(f.Name))
		saveErr := app.Save(record)
		if saveErr != nil {
			return saveErr
		}

		fresh := record.Fresh()
		refs := originalRecord.GetStringSlice("attachmentReferences")
		refs = append(refs, fresh.Id)
		originalRecord.Set("attachmentReferences", refs)
		err := app.Save(originalRecord)
		if err != nil {
			return err
		}
	}
	return nil
}
