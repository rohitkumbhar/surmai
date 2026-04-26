package assistant

import (
	bt "backend/types"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessCarRentals(app core.App, msg *bt.Email, user *core.Record, rentals []*bt.EmailCarRentalInfo) {
	for _, rental := range rentals {
		pickupTimestamp, dropOffTimestamp, parseErr := parseCarRentalTimestamps(app, rental.PickupDateTime, rental.DropoffDateTime)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, pickupTimestamp, dropOffTimestamp)
		if tripErr != nil {
			app.Logger().Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveCarRental(txApp, msg, trip, rental, pickupTimestamp, dropOffTimestamp)
		})

		if txErr != nil {
			return
		}
	}
}

func parseCarRentalTimestamps(app core.App, pickupStr, dropOffStr string) (types.DateTime, types.DateTime, error) {
	pickupTimestamp, err := types.ParseDateTime(pickupStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse car rental pickup date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	dropOffTimestamp, err := types.ParseDateTime(dropOffStr)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not parse car rental dropoff date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	return pickupTimestamp, dropOffTimestamp, nil
}

func saveCarRental(txApp core.App, msg *bt.Email, trip *bt.Trip, rental *bt.EmailCarRentalInfo, pickupTime, dropoffTime types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, trip.Id, msg.Attachments)

	if rental.Cost.Value != 0 {
		expenseId = saveCarRentalExpense(txApp, trip.Id, rental)
	}

	metadata := buildCarRentalMetadata(trip, rental)

	transportationsCollection, _ := txApp.FindCollectionByNameOrId("transportations")
	entity := core.NewRecord(transportationsCollection)
	entity.Set("trip", trip.Id)
	entity.Set("type", "rental_car")
	entity.Set("origin", rental.PickupLocation)
	entity.Set("destination", rental.DropoffLocation)
	entity.Set("departureTime", pickupTime)
	entity.Set("arrivalTime", dropoffTime)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", rental.Link)

	return txApp.Save(entity)
}

func saveCarRentalExpense(txApp core.App, tripId string, rental *bt.EmailCarRentalInfo) string {
	costValue := map[string]interface{}{
		"value":    rental.Cost.Value,
		"currency": rental.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "transportation")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Car Rental: %s", rental.RentalCompany))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildCarRentalMetadata(trip *bt.Trip, rental *bt.EmailCarRentalInfo) map[string]interface{} {

	metadata := map[string]interface{}{
		"rentalCompany":    rental.RentalCompany,
		"confirmationCode": rental.ReservationID,
	}

	place := FuzzyMatchDestination(trip.Destinations, rental.PickupLocation)

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
