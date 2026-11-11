package trips

import (
	"archive/zip"
	bt "backend/types"
	"bytes"
	"encoding/json"
	"io"
	"os"

	"github.com/pocketbase/dbx"

	"github.com/pocketbase/pocketbase/core"
)

func ExportTripArchive(app core.App, trip *core.Record, tripExport *os.File, currentUser *core.RequestInfo) error {

	zipWriter := zip.NewWriter(tripExport)

	t := exportTrip(app, trip, zipWriter)
	transportations := Transportations(app, trip)
	lodgings := Lodgings(app, trip)
	activities := Activities(app, trip)
	expenses := Expenses(app, trip)
	attachments, _ := writeAttachmentsWithMapping(app, trip, zipWriter)
	travellerProfiles := exportTravellerProfiles(app, trip, zipWriter, currentUser)

	exportedTrip := bt.ExportedTrip{
		Trip:              &t,
		Transportations:   transportations,
		Lodgings:          lodgings,
		Activities:        activities,
		Expenses:          expenses,
		Attachments:       attachments,
		TravellerProfiles: travellerProfiles,
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
		Destinations:       Destinations(app, trip),
		Participants:       Participants(app, trip),
		Travellers:         trip.GetStringSlice("travellers"),
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

		serverFile, _ := fsys.GetReader(fileKey)

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

func exportTravellerProfiles(app core.App, trip *core.Record, zipWriter *zip.Writer, requestInfo *core.RequestInfo) []*bt.TravellerProfile {
	travellerIds := trip.GetStringSlice("travellers")
	if len(travellerIds) == 0 {
		return nil
	}

	var payload []*bt.TravellerProfile
	for _, id := range travellerIds {
		profile, err := app.FindRecordById("traveller_profiles", id)
		if err != nil {
			app.Logger().Error("Error fetching traveller profile during export", "id", id, "error", err)
			continue
		}

		// Check access: the current user should be an owner or manager of the profile.
		canAccess, _ := app.CanAccessRecord(profile, requestInfo, profile.Collection().ViewRule)

		if !canAccess {
			app.Logger().Debug("Skipping traveller profile export due to lack of access", "id", id, "user", requestInfo.Auth.Id)
			continue
		}

		tp := bt.TravellerProfile{
			Id:          profile.Id,
			Email:       profile.GetString("email"),
			LegalName:   profile.GetString("legalName"),
			PassportId:  profile.GetString("passportId"),
			Attachments: profile.GetStringSlice("attachments"),
		}
		_ = profile.UnmarshalJSONField("additionalFields", &tp.AdditionalFields)

		for _, fileName := range tp.Attachments {
			_ = writeFileToArchive(app, profile, zipWriter, fileName)
		}

		payload = append(payload, &tp)
		app.Logger().Debug("Exported Traveller Profile data", "id", profile.Id)
	}

	return payload
}
