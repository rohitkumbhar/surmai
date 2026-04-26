package email

import (
	"backend/assistant/ai"
	bt "backend/types"
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"jaytaylor.com/html2text"
)

const ClassificationInstruction = `
You are an expert information extractor. Classify the following email as a flight reservation, train reservation,
hotel reservation, expense receipt or activity reservation. Say unknown if it doesn't fall into any of the categories 
mentioned earlier. Return the extracted details based on the classification.

Extract passenger names and emails when available.
Extract one single most relevant link from the email body, if available.

For flights, return the flight number, departure and arrival airport codes, departure and arrival dates and times in the ISO 8601 
format and cost of the flight including currency code in the 3 letter format. 

For activity reservations, return the activity name, description, date, time, and participant names and emails if available. All timestamps 
should be in the ISO 8601 format.

For hotel reservations, return the hotel name, confirmation code, address, check-in and check-out dates and times and guest 
names and emails if available. All timestamps should be in the ISO 8601 format.

For car rental reservations, return the reservation id, car rental company name, pick-up and drop-off dates and locations. 
All timestamps should be in the ISO 8601 format.

For any other transportation bookings like a bus ticket, train ticket, ferry or boat ticket, use category transportation_reservation and
return the transportation type like bike, train, bus etc, confirmation code, and any relevant details such as departure and arrival 
locations and start and end dates and times in the ISO 8601 format.

For parking reservations, return the confirmation code, parking company name, address of the location, start and end times in ISO 8601 format,
cost and spot number if available.

`

const (
	Unknown                  bt.EmailCategory = "unknown"
	FlightReservation        bt.EmailCategory = "flight_reservation"
	GenericTransportation    bt.EmailCategory = "transportation_reservation"
	CarRentalReservation     bt.EmailCategory = "car_rental_reservation"
	AccommodationReservation bt.EmailCategory = "hotel_reservation"
	ExpenseReceipt           bt.EmailCategory = "expense_receipt"
	ActivityReservation      bt.EmailCategory = "activity_reservation"
	ParkingReservation       bt.EmailCategory = "parking_reservation"
)

func getMessageBody(app core.App, msg *bt.Email) (string, error) {
	if msg == nil {
		return "", fmt.Errorf("email message cannot be nil")
	}

	if msg.TextBody != "" {
		return msg.TextBody, nil
	}

	if msg.HTMLBody != "" {
		text, err := html2text.FromString(msg.HTMLBody, html2text.Options{PrettyTables: true})
		if err != nil {
			app.Logger().Warn("Failed to convert HTML to text for message %s: %v", msg.Subject, err)
			return msg.HTMLBody, err
		}
		return text, nil
	}

	return msg.TextBody, nil
}

func ExtractEmailInfo(app core.App, msg *bt.Email) (*bt.EmailScanResult, error) {
	body, err := getMessageBody(app, msg)
	if err != nil {
		return nil, err
	}
	input := fmt.Sprintf("Subject: %s \n Body: %s", msg.Subject, body)

	resultChan := make(chan ai.CallResult[bt.EmailScanResult])
	go ai.Call(app, ClassificationInstruction, input, resultChan)
	callResult := <-resultChan

	if callResult.Err != nil {
		return nil, callResult.Err
	}

	return &callResult.Result, nil
}
