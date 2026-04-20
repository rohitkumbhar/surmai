package assistant

import (
	bt "backend/types"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessAccommodations(app core.App, msg *bt.Email, user *core.Record, accommodations []*bt.EmailHotelInfo) {
	for _, accommodation := range accommodations {
		checkInTimestamp, checkOutTimestamp, parseErr := parseAccommodationTimestamps(app, accommodation.CheckInDate, accommodation.CheckOutDate)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, checkInTimestamp, checkOutTimestamp)
		if tripErr != nil {
			app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveAccommodation(txApp, msg, trip, accommodation, checkInTimestamp, checkOutTimestamp)
		})

		if txErr != nil {
			return
		}
	}
}

func parseAccommodationTimestamps(app core.App, checkInStr, checkOutStr string) (types.DateTime, types.DateTime, error) {
	checkInTimestamp, err := types.ParseDateTime(checkInStr)
	if err != nil {
		app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not parse accommodation check-in date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	checkOutTimestamp, err := types.ParseDateTime(checkOutStr)
	if err != nil {
		app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not parse accommodation check-out date: %v", err))
		return types.NowDateTime(), types.NowDateTime(), err
	}

	return checkInTimestamp, checkOutTimestamp, nil
}

func saveAccommodation(txApp core.App, msg *bt.Email, trip *bt.Trip, accommodation *bt.EmailHotelInfo, checkIn, checkOut types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, trip.Id, msg.Attachments)

	if accommodation.Cost.Value != 0 {
		expenseId = saveAccommodationExpense(txApp, trip.Id, accommodation)
	}

	metadata := buildAccommodationMetadata(accommodation, trip)

	lodgingsCollection, _ := txApp.FindCollectionByNameOrId("lodgings")
	entity := core.NewRecord(lodgingsCollection)
	entity.Set("trip", trip.Id)
	entity.Set("name", accommodation.Name)
	entity.Set("type", accommodation.Type)
	entity.Set("address", accommodation.Address)
	entity.Set("confirmationCode", accommodation.ConfirmationCode)
	entity.Set("startDate", checkIn)
	entity.Set("endDate", checkOut)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", accommodation.Link)

	return txApp.Save(entity)
}

func saveAccommodationExpense(txApp core.App, tripId string, accommodation *bt.EmailHotelInfo) string {
	costValue := map[string]interface{}{
		"value":    accommodation.Cost.Value,
		"currency": accommodation.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "accommodation")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Accommodation: %s", accommodation.Name))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildAccommodationMetadata(accommodation *bt.EmailHotelInfo, trip *bt.Trip) map[string]interface{} {
	metadata := map[string]interface{}{}

	place := FuzzyMatchDestination(trip.Destinations, accommodation.Address)

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

	if len(accommodation.Guests) > 0 {
		guests := make([]map[string]string, 0, len(accommodation.Guests))
		for _, g := range accommodation.Guests {
			guests = append(guests, map[string]string{
				"name":  g.Name,
				"email": g.Email,
			})
		}
		metadata["guests"] = guests

	}

	return metadata
}
