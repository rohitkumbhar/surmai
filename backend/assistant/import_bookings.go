package assistant

import (
	"backend/assistant/email"
	bt "backend/types"
	"fmt"
	"strings"

	"github.com/pocketbase/pocketbase/core"
)

func ImportBookingsFromEmails(app core.App) error {

	emails, err := email.FetchUnreadEmails(app)
	if err != nil {
		return err
	}

	for _, msg := range emails {

		user, usrErr := app.FindAuthRecordByEmail("users", msg.From)
		if usrErr != nil {
			app.Logger().WithGroup("import_bookings").Debug(fmt.Sprintf("Cannot lookup user with email %s: %v", msg.From, err))
			continue
		}

		emailInfo, emailErr := email.ExtractEmailInfo(app, &msg)
		if emailErr != nil {
			app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not extract info from email: %v", emailErr))
			continue
		}

		switch emailInfo.Category {
		case email.FlightReservation:
			ProcessFlights(app, &msg, user, emailInfo.Flights)
		case email.GenericTransportation:
			ProcessTransportations(app, &msg, user, emailInfo.Transportations)
		case email.CarRentalReservation:
			ProcessCarRentals(app, &msg, user, emailInfo.Rentals)
		case email.AccommodationReservation:
			ProcessAccommodations(app, &msg, user, emailInfo.Hotels)
		case email.ExpenseReceipt:
			app.Logger().WithGroup("import_bookings").Debug("Processing expense receipt")
		case email.ActivityReservation:
			ProcessActivities(app, &msg, user, emailInfo.Activities)
		case email.ParkingReservation:
			ProcessParkings(app, &msg, user, emailInfo.Parkings)
		}
	}

	return nil
}

func FuzzyMatchDestination(destinations []bt.Destination, address string) *bt.Destination {
	if len(destinations) == 0 || address == "" {
		return nil
	}
	addressNormalized := normalizeString(address)
	addressParts := splitAddress(address)

	bestMatch := (*bt.Destination)(nil)
	bestScore := 0

	for i := range destinations {
		dest := &destinations[i]
		score := calculateDestinationScore(dest, addressNormalized, addressParts)
		if score > bestScore {
			bestScore = score
			bestMatch = dest
		}
	}

	if bestScore >= 2 {
		return bestMatch
	}
	return nil
}

func normalizeString(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, ",", " ")
	s = strings.ReplaceAll(s, "-", " ")
	s = strings.Join(strings.Fields(s), " ")
	return s
}

func splitAddress(address string) []string {
	normalized := normalizeString(address)
	return strings.Fields(normalized)
}

func calculateDestinationScore(dest *bt.Destination, addressNormalized string, addressParts []string) int {
	score := 0

	nameNorm := normalizeString(dest.Name)
	stateNorm := normalizeString(dest.StateName)
	countryNorm := normalizeString(dest.CountryName)

	if addressNormalized == nameNorm || addressNormalized == stateNorm || addressNormalized == countryNorm {
		return 10
	}

	if strings.Contains(addressNormalized, nameNorm) || strings.Contains(nameNorm, addressNormalized) {
		score += 5
	}
	if strings.Contains(addressNormalized, stateNorm) || strings.Contains(stateNorm, addressNormalized) {
		score += 4
	}
	if strings.Contains(addressNormalized, countryNorm) || strings.Contains(countryNorm, addressNormalized) {
		score += 3
	}

	for _, part := range addressParts {
		if len(part) < 3 {
			continue
		}
		if part == nameNorm || strings.Contains(nameNorm, part) {
			score += 2
		}
		if part == stateNorm || strings.Contains(stateNorm, part) {
			score += 2
		}
		if part == countryNorm || strings.Contains(countryNorm, part) {
			score += 2
		}
	}

	return score
}
