package flightaware

import (
	"backend/flights"
	"backend/types"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/ringsaturn/tzf"
	"io"
	"net/http"
	"time"
)

// FlightAwareResponse represents the response from the FlightAware AeroApi
type FlightAwareResponse struct {
	Links    Links    `json:"links"`
	NumPages int      `json:"num_pages"`
	Flights  []Flight `json:"flights"`
}

type Links struct {
	Next string `json:"next"`
}

type Flight struct {
	Ident                         string   `json:"ident"`
	IdentIcao                     string   `json:"ident_icao"`
	IdentIata                     string   `json:"ident_iata"`
	ActualRunwayOff               string   `json:"actual_runway_off"`
	ActualRunwayOn                string   `json:"actual_runway_on"`
	FaFlightId                    string   `json:"fa_flight_id"`
	Operator                      string   `json:"operator"`
	OperatorIcao                  string   `json:"operator_icao"`
	OperatorIata                  string   `json:"operator_iata"`
	FlightNumber                  string   `json:"flight_number"`
	Registration                  string   `json:"registration"`
	AtcIdent                      string   `json:"atc_ident"`
	InboundFaFlightId             string   `json:"inbound_fa_flight_id"`
	Codeshares                    []string `json:"codeshares"`
	CodesharesIata                []string `json:"codeshares_iata"`
	Blocked                       bool     `json:"blocked"`
	Diverted                      bool     `json:"diverted"`
	Cancelled                     bool     `json:"cancelled"`
	PositionOnly                  bool     `json:"position_only"`
	Origin                        Airport  `json:"origin"`
	Destination                   Airport  `json:"destination"`
	DepartureDelay                int      `json:"departure_delay"`
	ArrivalDelay                  int      `json:"arrival_delay"`
	FiledEte                      int      `json:"filed_ete"`
	ProgressPercent               int      `json:"progress_percent"`
	Status                        string   `json:"status"`
	AircraftType                  string   `json:"aircraft_type"`
	RouteDistance                 int      `json:"route_distance"`
	FiledAirspeed                 int      `json:"filed_airspeed"`
	FiledAltitude                 int      `json:"filed_altitude"`
	Route                         string   `json:"route"`
	BaggageClaim                  string   `json:"baggage_claim"`
	SeatsCabinBusiness            int      `json:"seats_cabin_business"`
	SeatsCabinCoach               int      `json:"seats_cabin_coach"`
	SeatsCabinFirst               int      `json:"seats_cabin_first"`
	GateOrigin                    string   `json:"gate_origin"`
	GateDestination               string   `json:"gate_destination"`
	TerminalOrigin                string   `json:"terminal_origin"`
	TerminalDestination           string   `json:"terminal_destination"`
	Type                          string   `json:"type"`
	ScheduledOut                  string   `json:"scheduled_out"`
	EstimatedOut                  string   `json:"estimated_out"`
	ActualOut                     string   `json:"actual_out"`
	ScheduledOff                  string   `json:"scheduled_off"`
	EstimatedOff                  string   `json:"estimated_off"`
	ActualOff                     string   `json:"actual_off"`
	ScheduledOn                   string   `json:"scheduled_on"`
	EstimatedOn                   string   `json:"estimated_on"`
	ActualOn                      string   `json:"actual_on"`
	ScheduledIn                   string   `json:"scheduled_in"`
	EstimatedIn                   string   `json:"estimated_in"`
	ActualIn                      string   `json:"actual_in"`
	ForesightPredictionsAvailable bool     `json:"foresight_predictions_available"`
}

type Airport struct {
	Code           string `json:"code"`
	CodeIcao       string `json:"code_icao"`
	CodeIata       string `json:"code_iata"`
	CodeLid        string `json:"code_lid"`
	Timezone       string `json:"timezone"`
	Name           string `json:"name"`
	City           string `json:"city"`
	AirportInfoUrl string `json:"airport_info_url"`
}

type FlightAware struct{}

func (fa FlightAware) GetFlightRoute(flightNumber string, config flights.FlightInfoProviderConfig, tzf tzf.F) (*flights.FlightRoute, error) {
	// Construct the API URL with the flight number
	url := fmt.Sprintf("https://aeroapi.flightaware.com/aeroapi/flights/%s?ident_type=designator", flightNumber)

	// Create a new HTTP client and make the request
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add the API key to the request headers
	req.Header.Add("x-apikey", config.ApiKey)

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to FlightAware API: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response from FlightAware API: %v", err)
	}

	// Check if the response status code is not successful
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("FlightAware API returned error: %s (status code: %d)", string(body), resp.StatusCode)
	}

	// Parse the JSON response
	var result FlightAwareResponse
	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse FlightAware API response: %v", err)
	}

	// Check if there are any flights in the response
	if len(result.Flights) == 0 {
		return nil, errors.New("no flights found for the given flight number")
	}

	// Use the first flight in the response
	flight := result.Flights[0]

	// Check if the flight is cancelled
	if flight.Cancelled {
		return nil, errors.New("flight is cancelled")
	}

	// Create origin airport
	originAirport := types.Airport{
		Name:       flight.Origin.Name,
		IataCode:   flight.Origin.CodeIata,
		IsoCountry: "", // Not provided in the API response
		Timezone:   flight.Origin.Timezone,
	}

	// Create destination airport
	destinationAirport := types.Airport{
		Name:       flight.Destination.Name,
		IataCode:   flight.Destination.CodeIata,
		IsoCountry: "", // Not provided in the API response
		Timezone:   flight.Destination.Timezone,
	}

	// Create airline
	airline := types.Airline{
		Name: flight.Operator,
	}

	// Parse departure and arrival times
	var departureTime, arrivalTime time.Time

	// Try to use actual times first, then estimated, then scheduled
	departureTimeStr := flight.ActualOut
	if departureTimeStr == "" {
		departureTimeStr = flight.EstimatedOut
	}
	if departureTimeStr == "" {
		departureTimeStr = flight.ScheduledOut
	}

	arrivalTimeStr := flight.ActualIn
	if arrivalTimeStr == "" {
		arrivalTimeStr = flight.EstimatedIn
	}
	if arrivalTimeStr == "" {
		arrivalTimeStr = flight.ScheduledIn
	}

	if departureTimeStr != "" {
		departureTime, err = time.Parse(time.RFC3339, departureTimeStr)
		if err != nil {
			// If there's an error parsing the time, just leave it as zero value
			departureTime = time.Time{}
		}
	}

	if arrivalTimeStr != "" {
		arrivalTime, err = time.Parse(time.RFC3339, arrivalTimeStr)
		if err != nil {
			// If there's an error parsing the time, just leave it as zero value
			arrivalTime = time.Time{}
		}
	}

	// Create flight route
	flightRoute := &flights.FlightRoute{
		Origin:        originAirport,
		Destination:   destinationAirport,
		Airline:       airline,
		DepartureTime: departureTime,
		ArrivalTime:   arrivalTime,
	}

	return flightRoute, nil
}
