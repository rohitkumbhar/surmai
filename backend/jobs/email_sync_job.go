package jobs

import (
	"backend/assistant"
	"backend/email"
	bt "backend/types"
	"encoding/json"
	"fmt"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

type EmailSyncJob struct {
	App core.App
}

func (job *EmailSyncJob) Execute() {

	// fetch config
	app := job.App
	config := job.fetchEmailSyncConfig()

	if config.Enabled == false {
		app.Logger().WithGroup("email_sync_job").Info("Email sync is disabled")
		return
	}

	// get new emails
	emails, err := email.FetchUnreadEmails(app, config)
	if err != nil {
		app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Error getting unread emails: %v", err))
		return
	}

	for _, msg := range emails {
		emailErr := job.processEmail(app, &msg)
		if emailErr != nil {
			return
		}
	}

	// update trip

	// mark email as read
}

func (job *EmailSyncJob) findMatchingTrip(user *core.Record, startTimestamp time.Time, endTimestamp time.Time) (*bt.Trip, error) {

	trip := bt.Trip{}

	err := job.App.DB().
		NewQuery("select id, name, description from trips where startDate <= {:startTimestamp} AND endDate >= {:endTimestamp} AND (ownerId = {:userId} or exists (select 1 from json_each(trips.collaborators) where value = {:userId}))").
		Bind(dbx.Params{
			"startTimestamp": startTimestamp,
			"endTimestamp":   endTimestamp,
			"userId":         user.Id}).One(&trip)

	if err != nil {
		return nil, err
	}

	return &trip, nil
}

func (job *EmailSyncJob) fetchEmailSyncConfig() (config bt.EmailSyncConfig) {

	emailSyncConfig, _ := job.App.FindAllRecords("surmai_settings",
		dbx.NewExp("id = {:configKey} ", dbx.Params{"configKey": "email_sync_config"}))

	if len(emailSyncConfig) == 0 {
		return bt.EmailSyncConfig{Enabled: false}
	}

	err := json.Unmarshal([]byte(emailSyncConfig[0].GetString("value")), &config)
	if err != nil {
		return bt.EmailSyncConfig{Enabled: false}
	}
	return config

}

func (job *EmailSyncJob) processEmail(app core.App, msg *bt.Email) error {

	from := msg.From

	// validate user exists
	user, userLookupError := app.FindAuthRecordByEmail("users", from)
	if userLookupError != nil {
		app.Logger().WithGroup("email_sync_job").Debug(fmt.Sprintf("Cannot lookup user with email %s: %v", from, userLookupError))
		return nil
	}

	// classify emails
	aiClient, aiErr := assistant.New(app)
	if aiErr != nil {
		app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Could not create AI client: %v", aiErr))
		return nil
	}

	result, err := aiClient.ExtractInfo(msg)
	if err != nil {
		app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Could not classify email: %v", err))
		return nil
	}

	//var tripData map[string]interface{}

	// extract info
	switch result.Category {
	case assistant.FlightReservation:
		flights := result.Flights
		for _, flight := range flights {

			departureTimestamp, timestampConversionError := time.Parse("2006-01-02T15:04:05", flight.DepartureDate)

			if timestampConversionError != nil {
				app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Could not parse departure date: %v", timestampConversionError))
				continue
			}
			arrivalTimestamp, timestampConversionError := time.Parse("2006-01-02T15:04:05", flight.ArrivalDate)
			if timestampConversionError != nil {
				app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Could not parse arrival date: %v", timestampConversionError))
				continue
			}

			trip, tripErr := job.findMatchingTrip(user, departureTimestamp, arrivalTimestamp)
			if tripErr != nil {
				app.Logger().WithGroup("email_sync_job").Error(fmt.Sprintf("Could not find matching trip: %v", err))
				continue
			}

			departure, _ := types.ParseDateTime(departureTimestamp)
			arrival, _ := types.ParseDateTime(arrivalTimestamp)

			txErr := app.RunInTransaction(func(txApp core.App) error {

				expenseId := ""
				attachmentIds := make([]string, 0)
				attachmentsCollection, _ := txApp.FindCollectionByNameOrId("trip_attachments")

				for _, emailAttachment := range msg.Attachments {
					attachmentsRecord := core.NewRecord(attachmentsCollection)
					attachmentsRecord.Set("trip", trip.Id)
					attachmentsRecord.Set("name", emailAttachment.Name)
					attachmentsRecord.Set("file", emailAttachment.Content)

					if ase := txApp.Save(attachmentsRecord); ase != nil {
						return ase
					}

					attachmentIds = append(attachmentIds, attachmentsRecord.Id)
				}

				if &flight.Cost != nil {

					costValue := map[string]interface{}{
						"value":    flight.Cost.Value,
						"currency": flight.Cost.Currency,
					}

					expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
					expensesRecord := core.NewRecord(expensesCollection)
					expensesRecord.Set("trip", trip.Id)
					expensesRecord.Set("category", "transportation")
					expensesRecord.Set("cost", costValue)
					expensesRecord.Set("name", fmt.Sprintf("Flight: %s -> %s", flight.DepartureAirportCode, flight.ArrivalAirportCode))
					expensesRecord.Set("occurredOn", types.NowDateTime())

					if ase := txApp.Save(expensesRecord); ase != nil {
						return ase
					}

					expenseId = expensesRecord.Id
				}

				// metadata
				metadata := map[string]interface{}{
					"flightNumber": flight.FlightNumber,
					"reservation":  flight.ConfirmationCode,
				}

				if &flight.Airline != nil {
					airlinesCollection, _ := txApp.FindCollectionByNameOrId("airlines")
					record, airlineLookupError := app.FindRecordsByFilter(airlinesCollection, "code = {:airlineCode} || name = {:airlineName}", "code", 1, 0, dbx.Params{
						"airlineCode": flight.Airline.Code,
						"airlineName": flight.Airline.Name,
					})

					if airlineLookupError == nil && len(record) == 1 {
						metadata["provider"] = record[0].FieldsData()
					}
				}

				if flight.DepartureAirportCode != "" {
					airportsCollection, _ := txApp.FindCollectionByNameOrId("airports")
					record, airportLookupError := app.FindRecordsByFilter(airportsCollection, "iataCode = {:airportCode}", "iataCode", 1, 0, dbx.Params{
						"airportCode": flight.DepartureAirportCode,
					})

					if airportLookupError == nil && len(record) == 1 {
						metadata["origin"] = record[0].FieldsData()
					}
				}

				if flight.ArrivalAirportCode != "" {
					airportsCollection, _ := txApp.FindCollectionByNameOrId("airports")
					record, airportLookupError := app.FindRecordsByFilter(airportsCollection, "iataCode = {:airportCode}", "iataCode", 1, 0, dbx.Params{
						"airportCode": flight.ArrivalAirportCode,
					})

					if airportLookupError == nil && len(record) == 1 {
						metadata["destination"] = record[0].FieldsData()
					}
				}

				if flight.Seats != "" {
					metadata["seats"] = flight.Seats
				}

				transportationsCollection, _ := txApp.FindCollectionByNameOrId("transportations")
				entity := core.NewRecord(transportationsCollection)
				entity.Set("trip", trip.Id)
				entity.Set("type", "flight")
				entity.Set("origin", flight.DepartureAirportCode)
				entity.Set("destination", flight.ArrivalAirportCode)
				entity.Set("departureTime", departure)
				entity.Set("arrivalTime", arrival)
				entity.Set("expenseId", expenseId)
				entity.Set("attachmentReferences", attachmentIds)
				entity.Set("metadata", metadata)

				return txApp.Save(entity)

			})

			if txErr != nil {
				return err
			}

		}
	}
	return nil

}
