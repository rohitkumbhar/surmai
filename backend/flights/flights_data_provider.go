package flights

import (
	"backend/types"
	"time"

	"github.com/ringsaturn/tzf"
)

type FlightRoute struct {
	Origin        types.Airport `json:"origin"`
	Destination   types.Airport `json:"destination"`
	Airline       types.Airline `json:"airline"`
	DepartureTime time.Time     `json:"departureTime"`
	ArrivalTime   time.Time     `json:"arrivalTime"`
}

type DataProvider interface {
	GetFlightRoute(flightNumber string, config *FlightInfoProviderConfig, tzf tzf.F) (*FlightRoute, error)
}

type FlightInfoProviderConfig struct {
	Enabled  bool   `json:"enabled"`
	Provider string `json:"provider"`
	ApiKey   string `json:"apiKey"`

	// BaseUrl points the provider at a different address, for a proxy or a
	// test server. Empty means the provider's own public API.
	BaseUrl string `json:"baseUrl"`
}
