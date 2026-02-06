package trips

import (
	"archive/zip"
	bt "backend/types"
	"bytes"
	"encoding/json"
	"io"
	"log"
	"os"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func ExportTripArchive(app core.App, trip *core.Record, tripExport *os.File) error {

	zipWriter := zip.NewWriter(tripExport)

	t := exportTrip(app, trip, zipWriter)
	transportations := exportTransportations(app, trip)
	lodgings := exportLodgings(app, trip)
	activities := exportActivities(app, trip)
	expenses := exportExpenses(app, trip)
	attachments, _ := writeAttachmentsWithMapping(app, trip, zipWriter)

	exportedTrip := bt.ExportedTrip{
		Trip:            &t,
		Transportations: transportations,
		Lodgings:        lodgings,
		Activities:      activities,
		Expenses:        expenses,
		Attachments:     attachments,
	}

	exportedTripEntities, err := json.MarshalIndent(exportedTrip, "", " ")
	tripJsonExport, _ := zipWriter.Create("trip.json")
	_, err = io.Copy(tripJsonExport, bytes.NewReader(exportedTripEntities))
	if err != nil {
		return err
	}

	return zipWriter.Close()
}

func exportTrip(app core.App, trip *core.Record, zipWriter *zip.Writer) bt.Trip {
	t := bt.Trip{
		Id:                 trip.Id,
		Name:               trip.GetString("name"),
		Description:        trip.GetString("description"),
		StartDate:          trip.GetDateTime("startDate"),
		EndDate:            trip.GetDateTime("endDate"),
		CoverImageFileName: trip.GetString("coverImage"),
		Notes:              trip.GetString("notes"),
		Destinations:       getDestinations(trip),
		Participants:       getParticipants(trip),
	}
	_ = trip.UnmarshalJSONField("budget", &t.Budget)

	// add cover image
	coverImageFileName := trip.GetString("coverImage")
	_ = writeFileToArchive(app, trip, zipWriter, coverImageFileName)

	return t
}

func writeAttachmentsWithMapping(app core.App, trip *core.Record, zipWriter *zip.Writer) ([]*bt.Attachment, error) {

	var attachmentExport []*bt.Attachment

	// add all trip attachments
	attachments, _ := app.FindAllRecords("trip_attachments", dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))
	for _, attachment := range attachments {
		fileName := attachment.GetString("file")
		attachmentExport = append(attachmentExport, &bt.Attachment{
			Id:   attachment.Id,
			Name: attachment.GetString("name"),
			File: fileName,
		})

		attachmentsError := writeFileToArchive(app, attachment, zipWriter, fileName)
		if attachmentsError != nil {
			return nil, attachmentsError
		}
	}
	return attachmentExport, nil
}

func writeFileToArchive(app core.App, record *core.Record, zipWriter *zip.Writer, fileName string) error {

	if fileName != "" {

		fileKey := record.BaseFilesPath() + "/" + fileName
		fsys, _ := app.NewFilesystem()
		defer fsys.Close()

		serverFile, _ := fsys.GetFile(fileKey)

		if serverFile != nil {
			defer serverFile.Close()

			coverImageExport, _ := zipWriter.Create("files/" + fileName)
			_, err := io.Copy(coverImageExport, serverFile)
			if err != nil {
				return err
			}
		}

	}
	return nil
}

func exportActivities(e core.App, trip *core.Record) []*bt.Activity {

	activities, _ := e.FindAllRecords("activities",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Activity
	for _, l := range activities {

		ct := bt.Activity{
			Id:                   l.Id,
			Name:                 l.GetString("name"),
			Description:          l.GetString("description"),
			Address:              l.GetString("address"),
			StartDate:            l.GetDateTime("startDate"),
			ConfirmationCode:     l.GetString("confirmationCode"),
			AttachmentReferences: l.GetStringSlice("attachmentReferences"),
			Link:                 l.GetString("link"),
		}
		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
		e.Logger().Debug("Exported Activity  data", "id", l.Id)
	}

	return payload

}

func exportLodgings(e core.App, trip *core.Record) []*bt.Lodging {

	lodgings, _ := e.FindAllRecords("lodgings",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Lodging
	for _, l := range lodgings {

		ct := bt.Lodging{
			Id:                   l.Id,
			Name:                 l.GetString("name"),
			Address:              l.GetString("address"),
			StartDate:            l.GetDateTime("startDate"),
			EndDate:              l.GetDateTime("endDate"),
			ConfirmationCode:     l.GetString("confirmationCode"),
			Type:                 l.GetString("type"),
			AttachmentReferences: l.GetStringSlice("attachmentReferences"),
			Link:                 l.GetString("link"),
		}

		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)

		payload = append(payload, &ct)
		e.Logger().Debug("Exported Lodging  data", "id", l.Id)

	}

	return payload

}

func exportTransportations(e core.App, trip *core.Record) []*bt.Transportation {

	transportations, _ := e.FindAllRecords("transportations",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Transportation
	for _, tr := range transportations {
		ct := bt.Transportation{
			Id:                   tr.Id,
			Type:                 tr.GetString("type"),
			Origin:               tr.GetString("origin"),
			Destination:          tr.GetString("destination"),
			Departure:            tr.GetDateTime("departureTime"),
			Arrival:              tr.GetDateTime("arrivalTime"),
			AttachmentReferences: tr.GetStringSlice("attachmentReferences"),
			Link:                 tr.GetString("link"),
		}
		_ = tr.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = tr.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
		e.Logger().Debug("Exported Transportation  data", "id", tr.Id)
	}

	return payload
}

func exportExpenses(e core.App, trip *core.Record) []*bt.Expense {

	expenses, _ := e.FindAllRecords("trip_expenses",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Expense
	for _, exp := range expenses {
		ct := bt.Expense{
			Id:                   exp.Id,
			Name:                 exp.GetString("name"),
			OccurredOn:           exp.GetDateTime("occurredOn"),
			Notes:                exp.GetString("notes"),
			Category:             exp.GetString("category"),
			AttachmentReferences: exp.GetStringSlice("attachmentReferences"),
		}
		_ = exp.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
		e.Logger().Debug("Exported Expense data", "id", exp.Id)
	}

	return payload
}

func getDestinations(trip *core.Record) []bt.Destination {
	destinationsString := trip.GetString("destinations")
	var payload []bt.Destination

	err := json.Unmarshal([]byte(destinationsString), &payload)
	if err != nil {
		log.Fatal("Error during Destinations Unmarshal(): ", err)
	}

	return payload
}

func getParticipants(trip *core.Record) []bt.Participant {
	participantString := trip.GetString("participants")
	var payload []bt.Participant

	err := json.Unmarshal([]byte(participantString), &payload)
	if err != nil {
		log.Fatal("Error during Participants Unmarshal(): ", err)
	}

	return payload
}
