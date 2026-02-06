package json

import (
	im "backend/trips/import/attachments"
	bt "backend/types"
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	t "go/types"
)

func ImportJsonFile(e core.App, fileContents []byte, ownerId string) (string, error) {

	var data bt.ExportedTrip
	err := json.Unmarshal(fileContents, &data)
	if err != nil {
		return "", err
	}

	if data.Trip == nil {
		return "", t.Error{Msg: "Cannot parse trip data"}
	}

	trip, tripError := importBasicTripInfo(e, ownerId, &data)
	if tripError != nil {
		return "", tripError
	}

	_, _ = createTransportations(e, trip.Id, &data)
	_, _ = createLodgings(e, trip.Id, &data)
	_, _ = createActivities(e, trip.Id, &data)
	_, _ = createExpenses(e, trip.Id, &data)
	return trip.Id, nil
}

func createTransportations(app core.App, tripId string, tripData *bt.ExportedTrip) ([]*core.Record, error) {

	collection, _ := app.FindCollectionByNameOrId("transportations")
	records := make([]*core.Record, 0, len(tripData.Transportations))
	if tripData.Transportations != nil {
		for _, tr := range tripData.Transportations {
			record := core.NewRecord(collection)
			record.Set("type", tr.Type)
			record.Set("origin", tr.Origin)
			record.Set("destination", tr.Destination)
			record.Set("departureTime", tr.Departure)
			record.Set("arrivalTime", tr.Arrival)
			record.Set("cost", tr.Cost)
			record.Set("metadata", tr.Metadata)
			record.Set("link", tr.Link)
			record.Set("trip", tripId)
			if tr.Attachments != nil && len(tr.Attachments) > 0 {
				attachmentReferences, _ := im.UploadAttachments(app, tr.Attachments, tripId)
				record.Set("attachmentReferences", attachmentReferences)
			}
			err := app.Save(record)
			if err != nil {
				return nil, err
			}
			records = append(records, record)
		}
	}

	return records, nil
}

func createLodgings(app core.App, tripId string, tripData *bt.ExportedTrip) ([]*core.Record, error) {

	collection, _ := app.FindCollectionByNameOrId("lodgings")
	records := make([]*core.Record, 0, len(tripData.Lodgings))
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
			record.Set("metadata", l.Metadata)
			record.Set("link", l.Link)
			record.Set("trip", tripId)
			if l.Attachments != nil && len(l.Attachments) > 0 {
				attachmentReferences, _ := im.UploadAttachments(app, l.Attachments, tripId)
				record.Set("attachmentReferences", attachmentReferences)
			}

			err := app.Save(record)
			if err != nil {
				return nil, err
			}
			records = append(records, record)
		}
	}

	return records, nil
}

func createActivities(app core.App, tripId string, tripData *bt.ExportedTrip) ([]*core.Record, error) {

	collection, _ := app.FindCollectionByNameOrId("activities")
	records := make([]*core.Record, 0, len(tripData.Activities))
	if tripData.Activities != nil {

		for _, a := range tripData.Activities {
			record := core.NewRecord(collection)
			record.Set("name", a.Name)
			record.Set("description", a.Description)
			record.Set("address", a.Address)
			record.Set("confirmationCode", a.ConfirmationCode)
			record.Set("startDate", a.StartDate)
			record.Set("cost", a.Cost)
			record.Set("metadata", a.Metadata)
			record.Set("link", a.Link)
			record.Set("trip", tripId)
			if a.Attachments != nil && len(a.Attachments) > 0 {
				attachmentReferences, _ := im.UploadAttachments(app, a.Attachments, tripId)
				record.Set("attachmentReferences", attachmentReferences)
			}

			err := app.Save(record)
			if err != nil {
				return nil, err
			}
			records = append(records, record)
		}
	}

	return records, nil
}

func createExpenses(app core.App, tripId string, tripData *bt.ExportedTrip) ([]*core.Record, error) {

	collection, _ := app.FindCollectionByNameOrId("trip_expenses")
	records := make([]*core.Record, 0, len(tripData.Expenses))
	if tripData.Expenses != nil {

		for _, e := range tripData.Expenses {
			record := core.NewRecord(collection)
			record.Set("name", e.Name)
			record.Set("cost", e.Cost)
			record.Set("occurredOn", e.OccurredOn)
			record.Set("notes", e.Notes)
			record.Set("category", e.Category)
			record.Set("trip", tripId)
			record.Set("attachmentReferences", e.AttachmentReferences)

			err := app.Save(record)
			if err != nil {
				return nil, err
			}
			records = append(records, record)
		}
	}

	return records, nil
}

func importBasicTripInfo(app core.App, userId string, data *bt.ExportedTrip) (*core.Record, error) {
	trips, _ := app.FindCollectionByNameOrId("trips")
	record := core.NewRecord(trips)

	tripData := data.Trip
	record.Set("name", tripData.Name)
	record.Set("description", tripData.Description)
	record.Set("startDate", tripData.StartDate)
	record.Set("endDate", tripData.EndDate)
	record.Set("destinations", tripData.Destinations)
	record.Set("participants", tripData.Participants)
	record.Set("ownerId", userId)
	record.Set("notes", tripData.Notes)
	record.Set("budget", tripData.Budget)

	if tripData.CoverImage != nil {
		file, fileErr := im.GetFile(tripData.CoverImage)
		if fileErr != nil {
			return nil, fileErr
		}
		record.Set("coverImage", file)
	}

	err := app.Save(record)
	if err != nil {
		return nil, err
	}

	return record, nil
}
