package types

import "time"

type EmailSyncConfig struct {
	Enabled      bool   `json:"enabled"`
	ImapHost     string `json:"imapHost"`
	ImapPort     int    `json:"imapPort"`
	ImapUser     string `json:"imapUser"`
	ImapPassword string `json:"imapPassword"`
}

type OpenAiEndpointConfig struct {
	Enabled  bool   `json:"enabled"`
	Endpoint string `json:"endpoint"`
	ApiKey   string `json:"apiKey"`
	Model    string `json:"model"`
}

type EmailAttachment struct {
	Name     string
	FileType string
	Content  []byte
}

type Email struct {
	MessageId   string
	Uid         uint32
	From        string
	Subject     string
	Date        time.Time
	TextBody    string
	HTMLBody    string
	Attachments []EmailAttachment
}

type EmailPassenger struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type EmailFlightInfo struct {
	FlightNumber         string           `json:"flight_number"`
	ConfirmationCode     string           `json:"confirmation_code"`
	DepartureAirportCode string           `json:"departure_airport_code"`
	ArrivalAirportCode   string           `json:"arrival_airport_code"`
	DepartureDate        string           `json:"departure_date"`
	ArrivalDate          string           `json:"arrival_date"`
	Passengers           []EmailPassenger `json:"passengers"`
	Cost                 Cost             `json:"cost"`
	Seats                string           `json:"seats"`
	Link                 string           `json:"link"`
	Airline              Airline          `json:"airline"`
}

type EmailActivityInfo struct {
	Name             string           `json:"name"`
	Description      string           `json:"description"`
	ConfirmationCode string           `json:"confirmation_code"`
	Address          string           `json:"address"`
	StartDate        string           `json:"start_date"`
	EndDate          string           `json:"end_date"`
	Link             string           `json:"link"`
	Participants     []EmailPassenger `json:"participants"`
	Cost             Cost             `json:"cost"`
}

type EmailCategory string

type EmailScanResult struct {
	Category   EmailCategory        `json:"category" jsonschema:"enum=flight_reservation,enum=train_reservation,enum=car_rental_reservation,enum=hotel_reservation,enum=unknown,enum=expense_receipt,enum=activity_reservation" jsonschema_description:"Classification of the types of reservations or reservations"`
	Flights    []*EmailFlightInfo   `json:"flights,omitempty" jsonschema:"omitempty" jsonschema_description:"Container for flight bookings information"`
	Activities []*EmailActivityInfo `json:"activities,omitempty" jsonschema:"omitempty" jsonschema_description:"Container for activity bookings information"`
}
