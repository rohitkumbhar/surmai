package assistant

import (
	"backend/assistant/email"
	"fmt"

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
			return nil
		}

		emailInfo, emailErr := email.ExtractEmailInfo(app, &msg)
		if emailErr != nil {
			app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not extract info from email: %v", emailErr))
			return nil
		}

		switch emailInfo.Category {
		case email.FlightReservation:
			ProcessFlights(app, &msg, user, emailInfo.Flights)
		case email.TrainReservation:
			app.Logger().WithGroup("import_bookings").Debug("Processing train reservation")
		case email.CarRentalReservation:
			app.Logger().WithGroup("import_bookings").Debug("Processing car rental reservation")
		case email.HotelReservation:
			app.Logger().WithGroup("import_bookings").Debug("Processing hotel reservation")
		case email.ExpenseReceipt:
			app.Logger().WithGroup("import_bookings").Debug("Processing expense receipt")
		case email.ActivityReservation:
			ProcessActivities(app, &msg, user, emailInfo.Activities)
		}

	}

	return nil
}
