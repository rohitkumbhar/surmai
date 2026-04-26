package assistant

import (
	bt "backend/types"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessTransportations(app core.App, msg *bt.Email, user *core.Record, transportations []*bt.EmailTransportationInfo) {
	for _, transportation := range transportations {
		startTimestamp, endTimestamp, parseErr := parseTransportationTimestamps(app, transportation.StartTime, transportation.EndTime)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, startTimestamp, endTimestamp)
		if tripErr != nil {
			app.Logger().Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveTransportation(txApp, msg, trip, transportation, startTimestamp, endTimestamp)
		})

		if txErr != nil {
			return
		}
	}
}

func parseTransportationTimestamps(app core.App, startStr, endStr string) (types.DateTime, types.DateTime, error) {
	startTimestamp, err := types.ParseDateTime(startStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse transportation start date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	endTimestamp, err := types.ParseDateTime(endStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse transportation end date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	return startTimestamp, endTimestamp, nil
}

func saveTransportation(txApp core.App, msg *bt.Email, trip *bt.Trip, transportation *bt.EmailTransportationInfo, startTime, endTime types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, trip.Id, msg.Attachments)

	if transportation.Cost.Value != 0 {
		expenseId = saveTransportationExpense(txApp, trip.Id, transportation)
	}

	metadata := buildTransportationMetadata(txApp, trip, transportation)

	transportationsCollection, _ := txApp.FindCollectionByNameOrId("transportations")
	entity := core.NewRecord(transportationsCollection)
	entity.Set("trip", trip.Id)
	entity.Set("type", transportation.TransportationType)
	entity.Set("origin", transportation.DepartureLocation)
	entity.Set("destination", transportation.ArrivalLocation)
	entity.Set("departureTime", startTime)
	entity.Set("arrivalTime", endTime)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", transportation.Link)

	return txApp.Save(entity)
}

func saveTransportationExpense(txApp core.App, tripId string, transportation *bt.EmailTransportationInfo) string {
	costValue := map[string]interface{}{
		"value":    transportation.Cost.Value,
		"currency": transportation.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "transportation")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Transportation: %s", transportation.TransportationType))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildTransportationMetadata(app core.App, trip *bt.Trip, transportation *bt.EmailTransportationInfo) map[string]interface{} {

	metadata := map[string]interface{}{
		"type":             transportation.TransportationType,
		"confirmationCode": transportation.ConfirmationCode,
	}

	place := FuzzyMatchDestination(trip.Destinations, transportation.DepartureLocation)

	if place != nil {
		metadata["origin"] = map[string]string{
			"name":        place.Name,
			"id":          place.Id,
			"stateName":   place.StateName,
			"countryName": place.CountryName,
			"timezone":    place.TimeZone,
			"latitude":    place.Latitude,
			"longitude":   place.Longitude,
		}
	}

	destinationPlace := FuzzyMatchDestination(trip.Destinations, transportation.ArrivalLocation)

	if destinationPlace != nil {
		metadata["destination"] = map[string]string{
			"name":        destinationPlace.Name,
			"id":          destinationPlace.Id,
			"stateName":   destinationPlace.StateName,
			"countryName": destinationPlace.CountryName,
			"timezone":    destinationPlace.TimeZone,
			"latitude":    destinationPlace.Latitude,
			"longitude":   destinationPlace.Longitude,
		}
	}

	return metadata
}
