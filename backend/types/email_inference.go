package types

import "github.com/pocketbase/pocketbase/tools/types"

// EmailInferenceRequest represents the request for email inference
type EmailInferenceRequest struct {
	EmailContent string `json:"emailContent"`
	EmailAddress string `json:"emailAddress"`
}

// EmailInferenceResponse represents the response from email inference
type EmailInferenceResponse struct {
	TripID          string                   `json:"tripId,omitempty"`
	Transportations []TransportationInferred `json:"transportations,omitempty"`
	Lodgings        []LodgingInferred        `json:"lodgings,omitempty"`
	Activities      []ActivityInferred       `json:"activities,omitempty"`
	Message         string                   `json:"message,omitempty"`
}

// TransportationInferred represents inferred transportation from email
type TransportationInferred struct {
	Type        string         `json:"type"`
	Origin      string         `json:"origin"`
	Destination string         `json:"destination"`
	Departure   types.DateTime `json:"departure"`
	Arrival     types.DateTime `json:"arrival"`
	Cost        *Cost          `json:"cost,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

// LodgingInferred represents inferred lodging from email
type LodgingInferred struct {
	Type             string         `json:"type"`
	Name             string         `json:"name"`
	Address          string         `json:"address"`
	StartDate        types.DateTime `json:"startDate"`
	EndDate          types.DateTime `json:"endDate"`
	ConfirmationCode string         `json:"confirmationCode,omitempty"`
	Cost             *Cost          `json:"cost,omitempty"`
	Metadata         map[string]any `json:"metadata,omitempty"`
}

// ActivityInferred represents inferred activity from email
type ActivityInferred struct {
	Name             string         `json:"name"`
	Description      string         `json:"description,omitempty"`
	Address          string         `json:"address,omitempty"`
	StartDate        types.DateTime `json:"startDate"`
	EndDate          types.DateTime `json:"endDate,omitempty"`
	ConfirmationCode string         `json:"confirmationCode,omitempty"`
	Cost             *Cost          `json:"cost,omitempty"`
	Metadata         map[string]any `json:"metadata,omitempty"`
}

// AIEmailInferenceResult represents the raw result from AI inference
type AIEmailInferenceResult struct {
	Transportations []AITransportation `json:"transportations,omitempty"`
	Lodgings        []AILodging        `json:"lodgings,omitempty"`
	Activities      []AIActivity       `json:"activities,omitempty"`
}

// AITransportation represents transportation data from AI
type AITransportation struct {
	Type             string  `json:"type"`
	Origin           string  `json:"origin"`
	Destination      string  `json:"destination"`
	Departure        string  `json:"departure"`
	Arrival          string  `json:"arrival"`
	CostValue        float64 `json:"costValue,omitempty"`
	Currency         string  `json:"currency,omitempty"`
	FlightNumber     string  `json:"flightNumber,omitempty"`
	Airline          string  `json:"airline,omitempty"`
	ConfirmationCode string  `json:"confirmationCode,omitempty"`
	SeatNumber       string  `json:"seatNumber,omitempty"`
	TerminalInfo     string  `json:"terminalInfo,omitempty"`
	RentalCompany    string  `json:"rentalCompany,omitempty"`
	VehicleType      string  `json:"vehicleType,omitempty"`
}

// AILodging represents lodging data from AI
type AILodging struct {
	Type             string  `json:"type"`
	Name             string  `json:"name"`
	Address          string  `json:"address"`
	StartDate        string  `json:"startDate"`
	EndDate          string  `json:"endDate"`
	ConfirmationCode string  `json:"confirmationCode,omitempty"`
	CostValue        float64 `json:"costValue,omitempty"`
	Currency         string  `json:"currency,omitempty"`
	RoomType         string  `json:"roomType,omitempty"`
	CheckInTime      string  `json:"checkInTime,omitempty"`
	CheckOutTime     string  `json:"checkOutTime,omitempty"`
	GuestName        string  `json:"guestName,omitempty"`
	PhoneNumber      string  `json:"phoneNumber,omitempty"`
}

// AIActivity represents activity data from AI
type AIActivity struct {
	Name             string  `json:"name"`
	Description      string  `json:"description,omitempty"`
	Address          string  `json:"address,omitempty"`
	StartDate        string  `json:"startDate"`
	EndDate          string  `json:"endDate,omitempty"`
	ConfirmationCode string  `json:"confirmationCode,omitempty"`
	CostValue        float64 `json:"costValue,omitempty"`
	Currency         string  `json:"currency,omitempty"`
	Category         string  `json:"category,omitempty"`
	Duration         string  `json:"duration,omitempty"`
	ParticipantCount int     `json:"participantCount,omitempty"`
}
