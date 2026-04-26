package assistant

import (
	bt "backend/types"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessParkings(app core.App, msg *bt.Email, user *core.Record, parkings []*bt.EmailParkingInfo) {
	for _, parking := range parkings {
		startTimestamp, endTimestamp, parseErr := parseParkingTimestamps(app, parking.StartTime, parking.EndTime)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, startTimestamp, endTimestamp)
		if tripErr != nil {
			app.Logger().Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveParking(txApp, msg, trip, parking, startTimestamp, endTimestamp)
		})

		if txErr != nil {
			return
		}
	}
}

func parseParkingTimestamps(app core.App, startStr, endStr string) (types.DateTime, types.DateTime, error) {
	startTimestamp, err := types.ParseDateTime(startStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse parking start date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	endTimestamp, err := types.ParseDateTime(endStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse parking end date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	return startTimestamp, endTimestamp, nil
}

func saveParking(txApp core.App, msg *bt.Email, trip *bt.Trip, parking *bt.EmailParkingInfo, startTime, endTime types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, trip.Id, msg.Attachments)

	if parking.Cost.Value != 0 {
		expenseId = saveParkingExpense(txApp, trip.Id, parking)
	}

	metadata := buildParkingMetadata(trip, parking)

	transportationsCollection, _ := txApp.FindCollectionByNameOrId("transportations")
	entity := core.NewRecord(transportationsCollection)
	entity.Set("trip", trip.Id)
	entity.Set("type", "parking")
	entity.Set("origin", parking.Address)
	entity.Set("destination", parking.Address)
	entity.Set("departureTime", startTime)
	entity.Set("arrivalTime", endTime)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", parking.Link)

	return txApp.Save(entity)
}

func saveParkingExpense(txApp core.App, tripId string, parking *bt.EmailParkingInfo) string {
	costValue := map[string]interface{}{
		"value":    parking.Cost.Value,
		"currency": parking.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "transportation")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Parking: %s", parking.CompanyName))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildParkingMetadata(trip *bt.Trip, parking *bt.EmailParkingInfo) map[string]interface{} {

	metadata := map[string]interface{}{
		"provider":         parking.CompanyName,
		"confirmationCode": parking.ConfirmationCode,
		"spotNumber":       parking.SpotNumber,
	}

	place := FuzzyMatchDestination(trip.Destinations, parking.Address)

	if place != nil {
		metadata["place"] = map[string]string{
			"name":        place.Name,
			"id":          place.Id,
			"stateName":   place.StateName,
			"countryName": place.CountryName,
			"timezone":    place.TimeZone,
			"latitude":    place.Latitude,
			"longitude":   place.Longitude,
		}
	}

	return metadata
}
