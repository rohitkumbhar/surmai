package assistant

import (
	bt "backend/types"
	"context"
	"encoding/json"
	"fmt"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"jaytaylor.com/html2text"
)

const EmailClassificationInstruction = `
You are an expert information extractor. Classify the following email as a flight reservation, train reservation,
hotel reservation, expense receipt or activity reservation. Say unknown if it doesn't fall into any of the categories 
mentioned earlier. Return the extracted details based on the classification.

Extract passenger names and emails when available.

For flights, return the flight number, departure and arrival airport codes, departure and arrival dates and times in the ISO 8601 
format and cost of the flight including currency code in the 3 letter format. 

For any other transportation modes, pick the right type departure and arrival station codes, departure and arrival dates in the ISO 8601 format.
For car rental reservations, return the car rental company name, pick-up and drop-off dates and locations. All timestamps should be in the ISO 8601 format.
For hotel or any accommodation reservations, return the hotel name, check-in and check-out dates, and guest names and emails if available. All timestamps should be in the ISO 8601 format.
For expense receipts, return the total amount, currency, and any relevant details such as travel dates and destinations.
For activity reservations, return the activity name, date, time, and participant names and emails if available. All timestamps should be in the ISO 8601 format.
`

type Passenger struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type EmailFlightInfo struct {
	FlightNumber         string      `json:"flight_number"`
	ConfirmationCode     string      `json:"confirmation_code"`
	DepartureAirportCode string      `json:"departure_airport_code"`
	ArrivalAirportCode   string      `json:"arrival_airport_code"`
	DepartureDate        string      `json:"departure_date"`
	ArrivalDate          string      `json:"arrival_date"`
	Passengers           []Passenger `json:"passengers"`
	Cost                 bt.Cost     `json:"cost"`
	Seats                string      `json:"seats"`
	Airline              bt.Airline  `json:"airline"`
}

type EmailTrainInfo struct {
	TrainNumber          string `json:"train_number"`
	DepartureStationCode string `json:"departure_station_code"`
	ArrivalStationCode   string `json:"arrival_station_code"`
	DepartureDate        string `json:"departure_date"`
	ArrivalDate          string `json:"arrival_date"`
}

func (a *Assistant) getMessageBody(msg *bt.Email) (string, error) {

	if msg == nil {
		return "", fmt.Errorf("email message cannot be nil")
	}

	if msg.TextBody != "" {
		return msg.TextBody, nil
	}

	if msg.HTMLBody != "" {
		text, err := html2text.FromString(msg.HTMLBody, html2text.Options{PrettyTables: true})
		if err != nil {
			a.App.Logger().Warn("Failed to convert HTML to text for message %s: %v", msg.Subject, err)
			return msg.HTMLBody, err
		}

		return text, nil
	}

	return msg.TextBody, nil
}

type EmailCategory string

const (
	Unknown              EmailCategory = "unknown"
	FlightReservation    EmailCategory = "flight_reservation"
	TrainReservation     EmailCategory = "train_reservation"
	CarRentalReservation EmailCategory = "car_rental_reservation"
	HotelReservation     EmailCategory = "hotel_reservation"
	ExpenseReceipt       EmailCategory = "expense_receipt"
	ActivityReservation  EmailCategory = "activity_reservation"
)

type EmailScanResult struct {
	Category EmailCategory      `json:"category" jsonschema:"enum=flight_reservation,enum=train_reservation,enum=car_rental_reservation,enum=hotel_reservation,enum=unknown,enum=expense_receipt,enum=activity_reservation" jsonschema_description:"Classification of the types of reservations or reservations"`
	Flights  []*EmailFlightInfo `json:"flight_info,omitempty" jsonschema:"omitempty"`
}

func (a *Assistant) ExtractInfo(msg *bt.Email) (*EmailScanResult, error) {

	body, err := a.getMessageBody(msg)
	if err != nil {
		return nil, err
	}

	var emailClassificationResultSchema = GenerateSchema[EmailScanResult]()
	input := fmt.Sprintf("Subject: %s \n Body: %s", msg.Subject, body)

	ctx := context.Background()
	client := openai.NewClient(
		option.WithAPIKey(a.AiConfig.ApiKey),
		option.WithBaseURL(a.AiConfig.Endpoint),
	)
	resp, err := client.Responses.New(ctx, responses.ResponseNewParams{
		Temperature:    openai.Float(0.1),
		PromptCacheKey: openai.String("surmai_email_classification"),
		Instructions:   openai.String(EmailClassificationInstruction),
		Input:          responses.ResponseNewParamsInputUnion{OfString: openai.String(input)},
		Model:          a.AiConfig.Model,
		Text: responses.ResponseTextConfigParam{
			Format: responses.ResponseFormatTextConfigParamOfJSONSchema(
				"email_classification",
				emailClassificationResultSchema,
			),
		},
	})

	if err != nil {
		return nil, err
	}

	result := EmailScanResult{}
	err = json.Unmarshal([]byte(resp.OutputText()), &result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}
