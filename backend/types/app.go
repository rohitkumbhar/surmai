package types

import (
	"github.com/pocketbase/pocketbase"
	"github.com/ringsaturn/tzf"
)

type SurmaiApp struct {
	Pb              *pocketbase.PocketBase
	DemoMode        *DemoMode
	AdminEmail      string
	TimezoneFinder  tzf.F
	WebhookSettings *EmailWebhookSettings
	LlmSettings     *LlmSettings
}

type DemoMode struct {
	Enabled      bool
	DemoEmail    string
	DemoPassword string
}

type LlmSettings struct {
	Type            string
	OllamaServerUrl string
	OpenAIApiKey    string
	ModelName       string
}
type EmailWebhookSettings struct {
	Enabled       bool
	WebhookSecret string
	ImapServer    string
	ImapUsername  string
	ImapPassword  string
}

type EmailEvent struct {
	Uid             float64 `json:"uid"`
	ToAddress       string  `json:"to_address"`
	FromAddress     string  `json:"from_address"`
	Subject         string  `json:"subject"`
	FromDisplayName string  `json:"from_display_name"`
	Mailbox         string  `json:"mailbox"`
}

type FetchEmailBodyResult struct {
	Text  string
	Html  string
	Error error
}

type InferredFlightData struct {
	DepartureDate            string `json:"departure_date"`
	ArrivalDate              string `json:"arrival_date"`
	DepartureTime            string `json:"departure_time"`
	ArrivalTime              string `json:"arrival_time"`
	DepartureAirportName     string `json:"departure_airport_name"`
	ArrivalAirportName       string `json:"arrival_airport_name"`
	DepartureAirportIataCode string `json:"departure_airport_iata_code"`
	ArrivalAirportIataCode   string `json:"arrival_airport_iata_code"`
	AirlineName              string `json:"airline_name"`
	ConfirmationCode         string `json:"confirmation_code"`
	Cost                     string `json:"cost"`
}

type FlightDataSchema struct {
	Flights []InferredFlightData `json:"flights"`
}

type InferFlightDataResults struct {
	Error   error
	Flights []InferredFlightData
}
