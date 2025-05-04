package webhook

import (
	"backend/ai"
	bt "backend/types"
	"errors"
	"fmt"
	"github.com/BrianLeishman/go-imap"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"strings"
	"time"
)

func ProcessEmailEvent(app core.App, surmai *bt.SurmaiApp, email bt.EmailEvent) {

	// call IMAP to get email text
	emailBodyChan := make(chan bt.FetchEmailBodyResult)
	go getEmailBody(surmai.WebhookSettings, email.Uid, emailBodyChan)
	emailBodyResult := <-emailBodyChan
	close(emailBodyChan)
	if emailBodyResult.Error != nil {
		fmt.Println(emailBodyResult.Error)
		return
	}

	// call LLM to deduce data in the email
	flightDataChan := make(chan bt.InferFlightDataResults)
	go inferFlightData(surmai.LlmSettings, emailBodyResult, flightDataChan)
	inferredFlights := <-flightDataChan
	close(flightDataChan)
	fmt.Println(inferredFlights)

	if inferredFlights.Error != nil {
		fmt.Println(inferredFlights.Error)
		return
	}

	// Find eligible trips based on the dates
	tripCandidates, err := findTripCandidates(app, inferredFlights, email)

	if err != nil {
		fmt.Println(err)
		return
	}

	// If there are more than 1 trips, find a trip specified in the email
	if len(tripCandidates) == 1 {
		err = addFlightsAsTransportationRecords(app, tripCandidates[0], inferredFlights, emailBodyResult, email)
		if err != nil {
			fmt.Println(err)
			return
		}
	} else {
		subject := email.Subject
		for _, trip := range tripCandidates {
			if strings.Contains(subject, trip.Id) {
				err = addFlightsAsTransportationRecords(app, tripCandidates[0], inferredFlights, emailBodyResult, email)
				if err != nil {
					fmt.Println(err)
					return
				}
			}
		}
	}
}

func addFlightsAsTransportationRecords(app core.App, trip bt.Trip, inferredFlights bt.InferFlightDataResults, emailBodyResult bt.FetchEmailBodyResult, email bt.EmailEvent) error {
	transportations, _ := app.FindCollectionByNameOrId("transportations")
	tripAttachments, _ := app.FindCollectionByNameOrId("trip_attachments")

	for _, flight := range inferredFlights.Flights {
		// add flight to transportations
		depDate := flight.DepartureDate
		depTime := flight.DepartureTime
		depTimestamp, _ := time.Parse("2006-01-02 15:04", fmt.Sprintf("%s %s", depDate, depTime))

		arrDate := flight.ArrivalDate
		arrTime := flight.ArrivalTime
		arrTimestamp, _ := time.Parse("2006-01-02 15:04", fmt.Sprintf("%s %s", arrDate, arrTime))

		metadata := map[string]interface{}{
			"origin":      map[string]interface{}{},
			"destination": map[string]interface{}{},
			"provider":    map[string]interface{}{},
		}
		// lookup airport metadata
		airportsInfo, airportInfoError := app.FindAllRecords("airports", dbx.In("iataCode", flight.ArrivalAirportIataCode, flight.DepartureAirportIataCode))
		if airportInfoError == nil {
			for _, record := range airportsInfo {
				iataCode := record.GetString("iataCode")
				if iataCode == flight.ArrivalAirportIataCode {
					metadata["destination"] = record.FieldsData()
				} else if iataCode == flight.DepartureAirportIataCode {
					metadata["origin"] = record.FieldsData()
				}
			}
		}

		// lookup airline metadata
		airlineInfo, airlineInfoError := app.FindAllRecords("airlines", dbx.HashExp{"name": flight.AirlineName})
		if airlineInfoError == nil && len(airlineInfo) == 1 {
			metadata["provider"] = airlineInfo[0].FieldsData()
		} else {
			metadata["provider"] = map[string]interface{}{
				"name": flight.AirlineName,
			}
		}

		// confirmation code to metadata
		if flight.ConfirmationCode != "" {
			metadata["reservation"] = flight.ConfirmationCode
		}

		attachmentName := fmt.Sprintf("%s.html", email.Subject)
		emailContent, _ := filesystem.NewFileFromBytes([]byte(emailBodyResult.Html), attachmentName)
		attachmentRecord := core.NewRecord(tripAttachments)
		attachmentRecord.Set("trip", trip.Id)
		attachmentRecord.Set("name", attachmentName)
		attachmentRecord.Set("file", emailContent)
		attachmentError := app.Save(attachmentRecord)
		if emailBodyResult.Error != nil {
			return attachmentError
		}

		record := core.NewRecord(transportations)
		record.Set("type", "flight")
		record.Set("origin", flight.DepartureAirportIataCode)
		record.Set("destination", flight.ArrivalAirportIataCode)
		record.Set("departureTime", depTimestamp)
		record.Set("arrivalTime", arrTimestamp)
		record.Set("metadata", metadata)
		record.Set("trip", trip.Id)
		record.Set("attachmentReferences", []string{attachmentRecord.Id})
		err := app.Save(record)
		if err != nil {
			return err
		}
	}
	return nil
}

func findTripCandidates(app core.App, inferredFlights bt.InferFlightDataResults, email bt.EmailEvent) ([]bt.Trip, error) {

	var minDeparture time.Time
	var maxArrival time.Time

	for _, flight := range inferredFlights.Flights {
		departureDate, _ := time.Parse(time.DateOnly, flight.DepartureDate)
		arrivalDate, _ := time.Parse(time.DateOnly, flight.DepartureDate)

		if minDeparture.IsZero() {
			minDeparture = departureDate
		} else if minDeparture.After(departureDate) {
			minDeparture = departureDate
		}

		if maxArrival.IsZero() {
			maxArrival = arrivalDate
		} else if maxArrival.Before(arrivalDate) {
			maxArrival = arrivalDate
		}
	}

	// user may be an owner or a collaborator
	user, err := app.FindAuthRecordByEmail("users", email.FromAddress)
	if err != nil {
		return nil, err
	}

	var tripCandidates []bt.Trip
	tripQuery := app.DB().Select("trips.Id", "trips.Name").
		From("trips").
		Where(dbx.NewExp("startDate <= {:minDeparture}", dbx.Params{"minDeparture": minDeparture})).
		AndWhere(dbx.NewExp("endDate >= {:maxArrival}", dbx.Params{"maxArrival": maxArrival})).
		AndWhere(dbx.Or(
			dbx.NewExp("collaborators -> '$' LIKE {:userIdLike}", dbx.Params{"userIdLike": "%" + user.Id + "%"}),
			dbx.NewExp("ownerId = {:userId}", dbx.Params{"userId": user.Id})))

	err = tripQuery.All(&tripCandidates)
	if err != nil {
		return nil, err
	}

	return tripCandidates, nil
}

func inferFlightData(settings *bt.LlmSettings, body bt.FetchEmailBodyResult, dataChan chan bt.InferFlightDataResults) {

	var assistant ai.Assistant

	switch settings.Type {
	case "openai":
		assistant = &ai.OpenAI{}
	case "ollama":
		assistant = &ai.Ollama{}
	}

	if assistant == nil {
		dataChan <- bt.InferFlightDataResults{
			Error: errors.New("no assistant found"),
		}
	} else {
		information := ai.FindFlightInformation(assistant, settings, body.Text)
		dataChan <- information
	}

}

func getEmailBody(settings *bt.EmailWebhookSettings, uid float64, bodyChan chan bt.FetchEmailBodyResult) {

	imap.RetryCount = 3

	// todo: optimize connection, eventually
	im, err := imap.New(settings.ImapUsername, settings.ImapPassword, settings.ImapServer, 993)
	if err != nil {
		bodyChan <- bt.FetchEmailBodyResult{
			Error: err,
		}
		return
	}

	defer func(im *imap.Dialer) {
		err := im.Close()
		if err != nil {
			bodyChan <- bt.FetchEmailBodyResult{
				Error: err,
			}
		}
	}(im)

	err = im.SelectFolder("INBOX")
	if err != nil {
		bodyChan <- bt.FetchEmailBodyResult{
			Error: err,
		}
		return
	}

	emails, err := im.GetEmails(int(uid))
	if err != nil {
		bodyChan <- bt.FetchEmailBodyResult{
			Error: err,
		}
		return
	}

	if len(emails) != 0 {
	out:
		for _, email := range emails {
			if email != nil {
				bodyChan <- bt.FetchEmailBodyResult{
					Text: email.Text,
					Html: email.HTML,
				}
				break out
			}
		}
	}

}
