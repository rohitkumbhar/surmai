package assistant

import (
	bt "backend/types"
	"fmt"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessFlights(app core.App, msg *bt.Email, user *core.Record, flights []*bt.EmailFlightInfo) {
	for _, flight := range flights {
		departureTimestamp, arrivalTimestamp, parseErr := parseFlightTimestamps(app, flight.DepartureDate, flight.ArrivalDate)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, departureTimestamp, arrivalTimestamp)
		if tripErr != nil {
			app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		departure, _ := types.ParseDateTime(departureTimestamp)
		arrival, _ := types.ParseDateTime(arrivalTimestamp)

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveFlightTransportation(txApp, msg, trip.Id, flight, departure, arrival)
		})

		if txErr != nil {
			return
		}
	}
}

func parseFlightTimestamps(app core.App, departureStr, arrivalStr string) (time.Time, time.Time, error) {
	departureTimestamp, err := time.Parse("2006-01-02T15:04:05", departureStr)
	if err != nil {
		app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not parse departure date: %v", err))
		return time.Time{}, time.Time{}, err
	}
	arrivalTimestamp, err := time.Parse("2006-01-02T15:04:05", arrivalStr)
	if err != nil {
		app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not parse arrival date: %v", err))
		return time.Time{}, time.Time{}, err
	}
	return departureTimestamp, arrivalTimestamp, nil
}

func saveFlightTransportation(txApp core.App, msg *bt.Email, tripId string, flight *bt.EmailFlightInfo, departure, arrival types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, tripId, msg.Attachments)

	if &flight.Cost != nil {
		expenseId = saveFlightExpense(txApp, tripId, flight)
	}

	metadata := buildFlightMetadata(txApp, msg, flight)

	transportationsCollection, _ := txApp.FindCollectionByNameOrId("transportations")
	entity := core.NewRecord(transportationsCollection)
	entity.Set("trip", tripId)
	entity.Set("type", "flight")
	entity.Set("origin", flight.DepartureAirportCode)
	entity.Set("destination", flight.ArrivalAirportCode)
	entity.Set("departureTime", departure)
	entity.Set("arrivalTime", arrival)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", flight.Link)

	return txApp.Save(entity)
}

func saveAttachments(txApp core.App, tripId string, attachments []bt.EmailAttachment) []string {
	if len(attachments) == 0 {
		return []string{}
	}

	attachmentIds := make([]string, 0, len(attachments))
	attachmentsCollection, _ := txApp.FindCollectionByNameOrId("trip_attachments")

	for _, emailAttachment := range attachments {
		attachmentsRecord := core.NewRecord(attachmentsCollection)
		attachmentsRecord.Set("trip", tripId)
		attachmentsRecord.Set("name", emailAttachment.Name)
		attachmentsRecord.Set("file", emailAttachment.Content)

		if err := txApp.Save(attachmentsRecord); err != nil {
			continue
		}
		attachmentIds = append(attachmentIds, attachmentsRecord.Id)
	}
	return attachmentIds
}

func saveFlightExpense(txApp core.App, tripId string, flight *bt.EmailFlightInfo) string {
	costValue := map[string]interface{}{
		"value":    flight.Cost.Value,
		"currency": flight.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "transportation")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Flight: %s -> %s", flight.DepartureAirportCode, flight.ArrivalAirportCode))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildFlightMetadata(app core.App, msg *bt.Email, flight *bt.EmailFlightInfo) map[string]interface{} {
	metadata := map[string]interface{}{
		"flightNumber": flight.FlightNumber,
		"reservation":  flight.ConfirmationCode,
	}

	if &flight.Airline != nil {
		if provider := lookupAirline(app, flight.Airline.Code, flight.Airline.Name); provider != nil {
			metadata["provider"] = provider
		}
	}

	if flight.DepartureAirportCode != "" {
		if origin := lookupAirport(app, flight.DepartureAirportCode); origin != nil {
			metadata["origin"] = origin
		}
	}

	if flight.ArrivalAirportCode != "" {
		if destination := lookupAirport(app, flight.ArrivalAirportCode); destination != nil {
			metadata["destination"] = destination
		}
	}

	if flight.Seats != "" {
		metadata["seats"] = flight.Seats
	}

	metadata["notes"] = fmt.Sprintf("Extracted from: %s", msg.Subject)

	return metadata
}

func findMatchingTrip(app core.App, user *core.Record, startTimestamp time.Time, endTimestamp time.Time) (*bt.Trip, error) {
	trip := bt.Trip{}
	err := app.DB().
		NewQuery("select id, name, description from trips where startDate <= {:startTimestamp} AND endDate >= {:endTimestamp} AND (ownerId = {:userId} or exists (select 1 from json_each(trips.collaborators) where value = {:userId}))").
		Bind(dbx.Params{
			"startTimestamp": startTimestamp,
			"endTimestamp":   endTimestamp,
			"userId":         user.Id,
		}).One(&trip)
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

func lookupAirline(app core.App, code, name string) map[string]interface{} {
	airlinesCollection, _ := app.FindCollectionByNameOrId("airlines")
	record, err := app.FindRecordsByFilter(airlinesCollection, "code = {:code} || name = {:name}", "code", 1, 0, dbx.Params{
		"code": code,
		"name": name,
	})
	if err == nil && len(record) == 1 {
		return record[0].FieldsData()
	}
	return nil
}

func lookupAirport(app core.App, iataCode string) map[string]interface{} {
	airportsCollection, _ := app.FindCollectionByNameOrId("airports")
	record, err := app.FindRecordsByFilter(airportsCollection, "iataCode = {:code}", "iataCode", 1, 0, dbx.Params{
		"code": iataCode,
	})
	if err == nil && len(record) == 1 {
		return record[0].FieldsData()
	}
	return nil
}
