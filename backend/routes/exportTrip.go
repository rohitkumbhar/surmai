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
	Type        string          `json:"type"`
	Origin      string          `json:"origin"`
	Destination string          `json:"destination"`
	Cost        *Cost           `json:"cost"`
	Departure   types.DateTime  `json:"departure"`
	Arrival     types.DateTime  `json:"arrival"`
	Attachments []*UploadedFile `json:"attachments"`
	Metadata    *map[string]any `json:"metadata"`
}

type Lodging struct {
	Id               string          `json:"id"`
	Type             string          `json:"type"`
	Name             string          `json:"name"`
	Address          string          `json:"address"`
	ConfirmationCode string          `json:"confirmationCode"`
	Cost             *Cost           `json:"cost"`
	StartDate        types.DateTime  `json:"startDate"`
	EndDate          types.DateTime  `json:"endDate"`
	Attachments      []*UploadedFile `json:"attachments"`
	Metadata         *map[string]any `json:"metadata"`
}

type Activity struct {
	Id               string          `json:"id"`
	Name             string          `json:"name"`
	Description      string          `json:"description"`
	Address          string          `json:"address"`
	ConfirmationCode string          `json:"confirmationCode"`
	Cost             *Cost           `json:"cost"`
	StartDate        types.DateTime  `json:"startDate"`
	Attachments      []*UploadedFile `json:"attachments"`
	Metadata         *map[string]any `json:"metadata"`
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
	lodgings := buildLodgings(e, trip)
	activities := buildActivities(e, trip)

	return e.JSON(http.StatusOK, map[string]any{
		"trip":            t,
		"transportations": transportations,
		"lodgings":        lodgings,
		"activities":      activities})
}

func buildActivities(e *core.RequestEvent, trip *core.Record) *[]Activity {

	activities, _ := e.App.FindAllRecords("activities",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []Activity
	for _, l := range activities {

		ct := Activity{
			Id:               l.Id,
			Name:             l.GetString("name"),
			Description:      l.GetString("description"),
			Address:          l.GetString("address"),
			StartDate:        l.GetDateTime("startDate"),
			ConfirmationCode: l.GetString("confirmationCode"),
			Metadata:         getMetadata(l),
			Cost:             getCost(l),
			Attachments:      getAttachments(e, l),
		}
		payload = append(payload, ct)
	}

	return &payload

}

func buildLodgings(e *core.RequestEvent, trip *core.Record) *[]Lodging {

	lodgings, _ := e.App.FindAllRecords("lodgings",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []Lodging
	for _, l := range lodgings {

		ct := Lodging{
			Id:               l.Id,
			Name:             l.GetString("name"),
			Address:          l.GetString("address"),
			StartDate:        l.GetDateTime("startDate"),
			EndDate:          l.GetDateTime("endDate"),
			ConfirmationCode: l.GetString("confirmationCode"),
			Type:             l.GetString("type"),
			Metadata:         getMetadata(l),
			Cost:             getCost(l),
			Attachments:      getAttachments(e, l),
		}
		payload = append(payload, ct)
	}

	return &payload

}

func buildTransportations(e *core.RequestEvent, trip *core.Record) *[]Transportation {

	transportations, _ := e.App.FindAllRecords("transportations",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []Transportation
	for _, tr := range transportations {

		ct := Transportation{
			Id:          tr.Id,
			Type:        tr.GetString("type"),
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
