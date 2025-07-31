package adsdb

import (
	"backend/flights"
	"backend/types"
	"encoding/json"
	"fmt"
	"github.com/ringsaturn/tzf"
	"io"
	"net/http"
)

// AirlineInfo Structs for ADSB API response
type AirlineInfo struct {
	Name       string `json:"name"`
	ICAO       string `json:"icao"`
	IATA       string `json:"iata"`
	Country    string `json:"country"`
	CountryISO string `json:"country_iso"`
	Callsign   string `json:"callsign"`
}

type AirportInfo struct {
	CountryISOName string  `json:"country_iso_name"`
	CountryName    string  `json:"country_name"`
	Elevation      int     `json:"elevation"`
	IATACode       string  `json:"iata_code"`
	ICAOCode       string  `json:"icao_code"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	Municipality   string  `json:"municipality"`
	Name           string  `json:"name"`
}

type FlightRouteInfo struct {
	Callsign     string      `json:"callsign"`
	CallsignICAO string      `json:"callsign_icao"`
	CallsignIATA string      `json:"callsign_iata"`
	Airline      AirlineInfo `json:"airline"`
	Origin       AirportInfo `json:"origin"`
	Destination  AirportInfo `json:"destination"`
}

type FlightRouteResponse struct {
	FlightRoute FlightRouteInfo `json:"flightroute"`
}

type ADSBResponse struct {
	Response FlightRouteResponse `json:"response"`
}

type AdsbDbCom struct{}

func (adsb AdsbDbCom) GetFlightRoute(flightNumber string, config flights.FlightInfoProviderConfig, tzf tzf.F) (*flights.FlightRoute, error) {

	// Create the URL with the flight number parameter
	url := fmt.Sprintf("https://api.adsbdb.com/v0/callsign/%s", flightNumber)

	// Create a new HTTP client and make the request
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Check if the response status code is not successful
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status code %d", resp.StatusCode)
	}

	// Parse the JSON response
	var result ADSBResponse
	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, err
	}

	// Create origin airport
	originAirport := types.Airport{
		Name:       result.Response.FlightRoute.Origin.Name,
		Latitude:   fmt.Sprintf("%f", result.Response.FlightRoute.Origin.Latitude),
		Longitude:  fmt.Sprintf("%f", result.Response.FlightRoute.Origin.Longitude),
		IataCode:   result.Response.FlightRoute.Origin.IATACode,
		IsoCountry: result.Response.FlightRoute.Origin.CountryISOName,
		Timezone:   tzf.GetTimezoneName(result.Response.FlightRoute.Origin.Longitude, result.Response.FlightRoute.Origin.Latitude),
	}

	// Create destination airport
	destinationAirport := types.Airport{
		Name:       result.Response.FlightRoute.Destination.Name,
		Latitude:   fmt.Sprintf("%f", result.Response.FlightRoute.Destination.Latitude),
		Longitude:  fmt.Sprintf("%f", result.Response.FlightRoute.Destination.Longitude),
		IataCode:   result.Response.FlightRoute.Destination.IATACode,
		IsoCountry: result.Response.FlightRoute.Destination.CountryISOName,
		Timezone:   tzf.GetTimezoneName(result.Response.FlightRoute.Destination.Longitude, result.Response.FlightRoute.Destination.Latitude),
	}

	airline := types.Airline{
		Name: result.Response.FlightRoute.Airline.Name,
	}

	// Create flight route
	flightRoute := &flights.FlightRoute{
		Origin:      originAirport,
		Destination: destinationAirport,
		Airline:     airline,
		// Note: The API response doesn't include departure and arrival times,
		// so these fields remain unset
	}

	return flightRoute, nil
}
