package routes

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
	"io"
	"log"
	"net/http"
)

type UploadedFile struct {
	FileName    string `json:"fileName"`
	FileContent string `json:"fileContent"`
}

type Destination struct {
	Name string `json:"name"`
}

type Participant struct {
	Name string `json:"name"`
}

type Cost struct {
	Value    float64 `json:"value"`
	Currency string  `json:"currency"`
}

type Transportation struct {
	Id          string          `json:"id"`
	Origin      string          `json:"origin"`
	Destination string          `json:"destination"`
	Cost        *Cost           `json:"cost"`
	Departure   types.DateTime  `json:"departure"`
	Arrival     types.DateTime  `json:"arrival"`
	Attachments []*UploadedFile `json:"attachments"`
	Metadata    *map[string]any `json:"metadata"`
}

type Trip struct {
	Id           string         `json:"id"`
	Name         string         `json:"name"`
	Description  string         `json:"description"`
	StartDate    types.DateTime `json:"startDate"`
	EndDate      types.DateTime `json:"endDate"`
	Created      types.DateTime `json:"created"`
	Updated      types.DateTime `json:"updated"`
	Destinations []Destination  `json:"destinations"`
	Participants []Participant  `json:"participants"`
	CoverImage   *UploadedFile  `json:"coverImage"`
}

func ExportTrip(e *core.RequestEvent) error {

	requestInfo, _ := e.RequestInfo()
	tripId, _ := requestInfo.Body["tripId"].(string)

	trip, err := e.App.FindRecordById("trips", tripId)
	if err != nil {
		return err
	}

	canAccess, err := e.App.CanAccessRecord(trip, requestInfo, trip.Collection().ViewRule)
	if err != nil {
		return err
	}
	if !canAccess {
		return e.UnauthorizedError("Cannot access this trip", nil)
	}

	t := Trip{
		Id:           trip.Id,
		Name:         trip.GetString("name"),
		Description:  trip.GetString("description"),
		StartDate:    trip.GetDateTime("startDate"),
		EndDate:      trip.GetDateTime("endDate"),
		CoverImage:   getUploadedFile(e, trip, trip.GetString("coverImage")),
		Destinations: getDestinations(trip),
		Participants: getParticipants(trip),
	}

	transportations := buildTransportations(e, trip)
	return e.JSON(http.StatusOK, map[string]any{"trip": t, "transportations": transportations})
}

func buildTransportations(e *core.RequestEvent, trip *core.Record) *[]Transportation {

	transportations, _ := e.App.FindAllRecords("transportations",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []Transportation

	for _, tr := range transportations {

		ct := Transportation{
			Id:          tr.Id,
			Origin:      tr.GetString("origin"),
			Destination: tr.GetString("destination"),
			Departure:   tr.GetDateTime("departureTime"),
			Arrival:     tr.GetDateTime("arrivalTime"),
			Metadata:    getMetadata(tr),
			Cost:        getCost(tr),
			Attachments: getAttachments(e, tr),
		}
		payload = append(payload, ct)
	}

	return &payload
}

func getAttachments(e *core.RequestEvent, r *core.Record) []*UploadedFile {

	attachments := r.GetStringSlice("attachments")
	var payload []*UploadedFile
	for _, attachmentName := range attachments {
		payload = append(payload, getUploadedFile(e, r, attachmentName))
	}
	return payload
}

func getUploadedFile(e *core.RequestEvent, record *core.Record, fileName string) *UploadedFile {

	if fileName != "" {
		return &UploadedFile{
			FileName:    fileName,
			FileContent: getFileAsBase64(e, record, fileName),
		}
	}
	return nil
}

func getFileAsBase64(e *core.RequestEvent, record *core.Record, fileName string) string {

	if fileName != "" {

		fileKey := record.BaseFilesPath() + "/" + fileName
		fsys, _ := e.App.NewFilesystem()
		defer fsys.Close()

		r, _ := fsys.GetFile(fileKey)
		defer r.Close()

		content := new(bytes.Buffer)
		_, _ = io.Copy(content, r)

		base64Str := base64.StdEncoding.EncodeToString(content.Bytes())
		return base64Str
	}

	return ""
}

func getCost(record *core.Record) *Cost {
	destinationsString := record.GetString("cost")
	var payload Cost

	err := json.Unmarshal([]byte(destinationsString), &payload)
	if err != nil {
		log.Fatal("Error during Cost Unmarshal(): ", err)
	}

	return &payload
}

func getMetadata(record *core.Record) *map[string]any {
	metadataString := record.GetString("metadata")
	payload := make(map[string]any)
	err := json.Unmarshal([]byte(metadataString), &payload)
	if err != nil {
		log.Fatal("Error during Metadata Unmarshal(): ", err)
	}

	return &payload
}

func getDestinations(trip *core.Record) []Destination {
	destinationsString := trip.GetString("destinations")
	var payload []Destination

	err := json.Unmarshal([]byte(destinationsString), &payload)
	if err != nil {
		log.Fatal("Error during Destinations Unmarshal(): ", err)
	}

	return payload
}

func getParticipants(trip *core.Record) []Participant {
	participantString := trip.GetString("participants")
	var payload []Participant

	err := json.Unmarshal([]byte(participantString), &payload)
	if err != nil {
		log.Fatal("Error during Participants Unmarshal(): ", err)
	}

	return payload
}
