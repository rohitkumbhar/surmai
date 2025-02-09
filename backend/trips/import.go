package trips

import (
	bt "backend/types"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"go/types"
	"mime/multipart"
)

func Import(e core.App, file multipart.File, ownerId string) (string, error) {

	var buff bytes.Buffer
	_, _ = buff.ReadFrom(file)

	var data bt.ExportedTrip
	err := json.Unmarshal(buff.Bytes(), &data)
	if err != nil {
		return "", err
	}

	if data.Trip == nil {
		return "", types.Error{Msg: "Cannot parse trip data"}
	}

	trip, tripError := createTrip(e, ownerId, &data)
	if tripError != nil {
		return "", tripError
	}

	_, _ = createTransportations(e, trip.Id, &data)
	_, _ = createLodgings(e, trip.Id, &data)
	_, _ = createActivities(e, trip.Id, &data)
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
			record.Set("trip", tripId)
			if tr.Attachments != nil {
				files, _ := getFiles(tr.Attachments)
				record.Set("attachments", files)
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
			record.Set("trip", tripId)
			if l.Attachments != nil {
				files, _ := getFiles(l.Attachments)
				record.Set("attachments", files)
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
			record.Set("trip", tripId)
			if a.Attachments != nil {
				files, _ := getFiles(a.Attachments)
				record.Set("attachments", files)
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

func createTrip(app core.App, userId string, data *bt.ExportedTrip) (*core.Record, error) {
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

	if tripData.CoverImage != nil {
		file, fileErr := getFile(tripData.CoverImage)
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

func getFiles(attachments []*bt.UploadedFile) ([]*filesystem.File, error) {

	files := make([]*filesystem.File, 0, len(attachments))
	for _, attachment := range attachments {
		file, _ := getFile(attachment)
		files = append(files, file)
	}
	return files, nil
}

func getFile(uploadedFile *bt.UploadedFile) (*filesystem.File, error) {

	fileName := uploadedFile.FileName
	encodedFileContent := uploadedFile.FileContent
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedFileContent)
	if err != nil {
		return nil, err
	}

	file, err := filesystem.NewFileFromBytes(decodedBytes, fileName)
	if err != nil {
		return nil, err
	}

	return file, nil
}
