package zip

import (
	"archive/zip"
	bt "backend/types"
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func ImportZip(e core.App, zipReader *zip.Reader, ownerId string) (string, error) {

	tripFileContents, _ := zipReader.Open("trip.json")
	defer tripFileContents.Close()

	var fileBuffer bytes.Buffer
	_, err := fileBuffer.ReadFrom(tripFileContents)
	if err != nil {
		return "", err
	}

	var data bt.ExportedTrip
	err = json.Unmarshal(fileBuffer.Bytes(), &data)
	if err != nil {
		return "", err
	}

	// create trip basic info
	tripId, err := importBasicTripInfo(e, data.Trip, ownerId, zipReader)
	if err != nil {
		return "", err
	}

	// import traveller profiles
	importTravellerProfiles(e, data, ownerId, zipReader, tripId)

	// upload all attachments and return the old id - new id mapping
	attachmentReferenceMapping := importAttachments(e, zipReader, data, tripId)

	// create expenses and return the old id - new id mapping
	expenseMapping := importExpenses(e, attachmentReferenceMapping, data, tripId)

	// create transportations
	importTransportations(e, attachmentReferenceMapping, expenseMapping, data, tripId)

	// create lodgings
	importLodgings(e, attachmentReferenceMapping, expenseMapping, data, tripId)

	// create activities
	importActivities(e, attachmentReferenceMapping, expenseMapping, data, tripId)

	return tripId, nil
}

func importActivities(app core.App, mapping map[string]string, expenseMapping map[string]string, tripData bt.ExportedTrip, tripId string) {

	collection, _ := app.FindCollectionByNameOrId("activities")
	if tripData.Activities != nil {
		for _, a := range tripData.Activities {
			record := core.NewRecord(collection)
			record.Set("name", a.Name)
			record.Set("description", a.Description)
			record.Set("address", a.Address)
			record.Set("confirmationCode", a.ConfirmationCode)
			record.Set("startDate", a.StartDate)
			record.Set("endDate", a.EndDate)
			record.Set("link", a.Link)
			record.Set("cost", a.Cost)
			record.Set("metadata", a.Metadata)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", getMappedAttachments(mapping, a.AttachmentReferences))
			record.Set("expenseId", getOrLinkExpense(app, a.ExpenseId, expenseMapping, tripData, tripId, mapping))
			_ = app.Save(record)
		}
	}
}

func importExpenses(app core.App, mapping map[string]string, tripData bt.ExportedTrip, tripId string) map[string]string {
	expenseMapping := make(map[string]string)
	collection, _ := app.FindCollectionByNameOrId("trip_expenses")
	if tripData.Expenses != nil {
		for _, e := range tripData.Expenses {
			record := core.NewRecord(collection)
			record.Set("name", e.Name)
			record.Set("cost", e.Cost)
			record.Set("occurredOn", e.OccurredOn)
			record.Set("notes", e.Notes)
			record.Set("category", e.Category)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", getMappedAttachments(mapping, e.AttachmentReferences))
			_ = app.Save(record)
			expenseMapping[e.Id] = record.Id
		}
	}
	return expenseMapping
}

func getOrLinkExpense(app core.App, oldExpenseId string, expenseMapping map[string]string, tripData bt.ExportedTrip, tripId string, mapping map[string]string) string {
	if oldExpenseId == "" {
		return ""
	}

	if newId, ok := expenseMapping[oldExpenseId]; ok {
		return newId
	}

	// Not found in mapping, check if it exists in tripData to create it
	for _, e := range tripData.Expenses {
		if e.Id == oldExpenseId {
			collection, _ := app.FindCollectionByNameOrId("trip_expenses")
			record := core.NewRecord(collection)
			record.Set("name", e.Name)
			record.Set("cost", e.Cost)
			record.Set("occurredOn", e.OccurredOn)
			record.Set("notes", e.Notes)
			record.Set("category", e.Category)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", getMappedAttachments(mapping, e.AttachmentReferences))
			err := app.Save(record)
			if err == nil {
				expenseMapping[oldExpenseId] = record.Id
				return record.Id
			}
		}
	}

	// If still not found, create a generic expense entry as fallback
	collection, _ := app.FindCollectionByNameOrId("trip_expenses")
	record := core.NewRecord(collection)
	record.Set("name", "Imported Expense")
	record.Set("trip", tripId)
	err := app.Save(record)
	if err == nil {
		expenseMapping[oldExpenseId] = record.Id
		return record.Id
	}

	return ""
}

func importLodgings(app core.App, mapping map[string]string, expenseMapping map[string]string, tripData bt.ExportedTrip, tripId string) {
	collection, _ := app.FindCollectionByNameOrId("lodgings")

	if tripData.Lodgings != nil {

		for _, l := range tripData.Lodgings {
			record := core.NewRecord(collection)
			record.Set("type", l.Type)
			record.Set("name", l.Name)
			record.Set("address", l.Address)
			record.Set("confirmationCode", l.ConfirmationCode)
			record.Set("startDate", l.StartDate)
			record.Set("endDate", l.EndDate)
			record.Set("cost", l.Cost)
			record.Set("link", l.Link)
			record.Set("metadata", l.Metadata)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", getMappedAttachments(mapping, l.AttachmentReferences))
			record.Set("expenseId", getOrLinkExpense(app, l.ExpenseId, expenseMapping, tripData, tripId, mapping))
			err := app.Save(record)

			if err != nil {
				app.Logger().Error("Cannot create Lodging entry %v", err)
			}
		}
	}
}

func getMappedAttachments(attachmentReferenceMapping map[string]string, existing []string) []string {
	var result = make([]string, 0)

	for _, id := range existing {
		mappedId := attachmentReferenceMapping[id]
		if mappedId != "" {
			result = append(result, mappedId)
		}
	}

	return result
}

func importTransportations(e core.App, attachmentReferenceMapping map[string]string, expenseMapping map[string]string, tripData bt.ExportedTrip, tripId string) {

	collection, _ := e.FindCollectionByNameOrId("transportations")
	if tripData.Transportations != nil {
		for _, tr := range tripData.Transportations {
			record := core.NewRecord(collection)
			record.Set("type", tr.Type)
			record.Set("origin", tr.Origin)
			record.Set("destination", tr.Destination)
			record.Set("departureTime", tr.Departure)
			record.Set("arrivalTime", tr.Arrival)
			record.Set("cost", tr.Cost)
			record.Set("link", tr.Link)
			record.Set("metadata", tr.Metadata)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", getMappedAttachments(attachmentReferenceMapping, tr.AttachmentReferences))
			record.Set("expenseId", getOrLinkExpense(e, tr.ExpenseId, expenseMapping, tripData, tripId, attachmentReferenceMapping))
			_ = e.Save(record)

		}
	}
}

func importAttachments(e core.App, zipReader *zip.Reader, data bt.ExportedTrip, tripId string) map[string]string {
	attachmentReferenceMapping := make(map[string]string)
	tripAttachments, _ := e.FindCollectionByNameOrId("trip_attachments")
	for _, attachment := range data.Attachments {

		attachmentFile, _ := zipReader.Open(fmt.Sprintf("files/%s", attachment.File))
		defer attachmentFile.Close()
		var buffer bytes.Buffer
		_, _ = buffer.ReadFrom(attachmentFile)
		file, _ := filesystem.NewFileFromBytes(buffer.Bytes(), attachment.Name)

		record := core.NewRecord(tripAttachments)
		record.Set("name", attachment.Name)
		record.Set("file", file)
		record.Set("trip", tripId)
		_ = e.Save(record)
		attachmentReferenceMapping[attachment.Id] = record.Id
	}

	return attachmentReferenceMapping
}

func importTravellerProfiles(app core.App, data bt.ExportedTrip, ownerId string, zipReader *zip.Reader, tripId string) {
	collection, err := app.FindCollectionByNameOrId("traveller_profiles")
	if err != nil {
		return
	}

	if data.TravellerProfiles == nil {
		return
	}

	var tripTravellerIds []string
	for _, tp := range data.TravellerProfiles {
		existing, err := app.FindFirstRecordByData("traveller_profiles", "email", tp.Email)
		if err == nil && existing != nil {
			tripTravellerIds = append(tripTravellerIds, existing.Id)
			continue
		}

		record := core.NewRecord(collection)
		record.Set("email", tp.Email)
		record.Set("legalName", tp.LegalName)
		record.Set("passportId", tp.PassportId)
		record.Set("additionalFields", tp.AdditionalFields)
		record.Set("ownerId", ownerId)

		var profileFiles []*filesystem.File
		for _, fileName := range tp.Attachments {
			attachmentFile, err := zipReader.Open(fmt.Sprintf("files/%s", fileName))
			if err != nil {
				continue
			}
			defer attachmentFile.Close()
			var buffer bytes.Buffer
			_, _ = buffer.ReadFrom(attachmentFile)
			file, _ := filesystem.NewFileFromBytes(buffer.Bytes(), fileName)
			profileFiles = append(profileFiles, file)
		}
		record.Set("attachments", profileFiles)

		err = app.Save(record)
		if err == nil {
			tripTravellerIds = append(tripTravellerIds, record.Id)
		}
	}

	if len(tripTravellerIds) > 0 {
		tripRecord, err := app.FindRecordById("trips", tripId)
		if err == nil {
			tripRecord.Set("travellers", tripTravellerIds)
			_ = app.Save(tripRecord)
		}
	}
}

func importBasicTripInfo(app core.App, trip *bt.Trip, ownerId string, zipReader *zip.Reader) (string, error) {

	trips, _ := app.FindCollectionByNameOrId("trips")
	record := core.NewRecord(trips)

	record.Set("name", trip.Name)
	record.Set("description", trip.Description)
	record.Set("startDate", trip.StartDate)
	record.Set("endDate", trip.EndDate)
	record.Set("destinations", trip.Destinations)
	record.Set("participants", trip.Participants)
	record.Set("ownerId", ownerId)
	record.Set("notes", trip.Notes)
	record.Set("budget", trip.Budget)

	if trip.CoverImageFileName != "" {
		coverImageFile, readError := zipReader.Open(fmt.Sprintf("files/%s", trip.CoverImageFileName))
		if readError == nil {
			defer coverImageFile.Close()
			var buffer bytes.Buffer
			_, _ = buffer.ReadFrom(coverImageFile)
			file, _ := filesystem.NewFileFromBytes(buffer.Bytes(), trip.CoverImageFileName)
			record.Set("coverImage", file)
		}
	}

	err := app.Save(record)
	if err != nil {
		return "", err
	}

	return record.Id, nil

}
