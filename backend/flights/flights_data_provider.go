package flights

import (
	"backend/types"
	"github.com/ringsaturn/tzf"
	"time"
)

type FlightRoute struct {
	Origin        types.Airport `json:"origin"`
	Destination   types.Airport `json:"destination"`
	Airline       types.Airline `json:"airline"`
	DepartureTime time.Time     `json:"departureTime"`
	ArrivalTime   time.Time     `json:"arrivalTime"`
}

type DataProvider interface {
	GetFlightRoute(flightNumber string, config FlightInfoProviderConfig, tzf tzf.F) (*FlightRoute, error)
}

type FlightInfoProviderConfig struct {
	Enabled  bool   `json:"enabled"`
	Provider string `json:"provider"`
	ApiKey   string `json:"apiKey"`
}
