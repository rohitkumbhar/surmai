package services

import (
	"context"
	"fmt"
	"time"

	"backend/types"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/compat_oai/openai"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	pb_types "github.com/pocketbase/pocketbase/tools/types"
)

// EmailInferenceService handles email inference operations
type EmailInferenceService struct {
	app       core.App
	genkit    *genkit.Genkit
	modelName string
}

// NewEmailInferenceService creates a new email inference service
func NewEmailInferenceService(app core.App, openaiAPIKey string) (*EmailInferenceService, error) {
	ctx := context.Background()

	// Create OpenAI plugin
	oai := &openai.OpenAI{APIKey: openaiAPIKey}

	// Initialize genkit with OpenAI plugin
	g := genkit.Init(ctx,
		genkit.WithPlugins(oai),
		genkit.WithDefaultModel("openai/gpt-4o"),
	)

	return &EmailInferenceService{
		app:       app,
		genkit:    g,
		modelName: "openai/gpt-4o",
	}, nil
}

// InferFromEmail extracts structured data from email content using AI
func (s *EmailInferenceService) InferFromEmail(ctx context.Context, emailContent string) (*types.AIEmailInferenceResult, error) {
	prompt := fmt.Sprintf(`You are an expert at extracting travel information from emails.
Analyze the following email content and extract any flights, lodging, and activities.

For each item found:
- Transportations: Extract type (flight, car, bus, boat, train, rental_car), origin, destination, departure/arrival times (ISO 8601 format), costs, confirmation codes, and any relevant metadata (flight numbers, airlines, seat numbers, terminal info, rental companies, vehicle types)
- Lodgings: Extract type (hotel, home, vacation_rental, camp_site), name, address, check-in/check-out dates (ISO 8601 format), costs, confirmation codes, and metadata (room type, guest name, phone number)
- Activities: Extract name, description, address, start/end dates (ISO 8601 format), costs, confirmation codes, and metadata (category, duration, participant count)

Return ONLY a valid JSON object with this exact structure (no additional text):
{
  "transportations": [
    {
      "type": "flight",
      "origin": "San Francisco",
      "destination": "New York",
      "departure": "2025-12-01T10:00:00Z",
      "arrival": "2025-12-01T18:00:00Z",
      "costValue": 350.00,
      "currency": "USD",
      "flightNumber": "UA123",
      "airline": "United Airlines",
      "confirmationCode": "ABC123",
      "seatNumber": "12A",
      "terminalInfo": "Terminal 3"
    }
  ],
  "lodgings": [
    {
      "type": "hotel",
      "name": "Grand Hotel",
      "address": "123 Main St, New York, NY 10001",
      "startDate": "2025-12-01T15:00:00Z",
      "endDate": "2025-12-05T11:00:00Z",
      "confirmationCode": "HTL456",
      "costValue": 150.00,
      "currency": "USD",
      "roomType": "Deluxe King",
      "checkInTime": "3:00 PM",
      "checkOutTime": "11:00 AM",
      "guestName": "John Doe",
      "phoneNumber": "+1234567890"
    }
  ],
  "activities": [
    {
      "name": "Museum Tour",
      "description": "Guided tour of the Metropolitan Museum",
      "address": "1000 5th Ave, New York, NY 10028",
      "startDate": "2025-12-02T10:00:00Z",
      "endDate": "2025-12-02T14:00:00Z",
      "confirmationCode": "ACT789",
      "costValue": 45.00,
      "currency": "USD",
      "category": "tour",
      "duration": "4 hours",
      "participantCount": 2
    }
  ]
}

If no items of a category are found, return an empty array for that category.
All dates must be in ISO 8601 format with timezone.

Email content:
%s`, emailContent)

	// Generate response using genkit with structured output
	result, _, err := genkit.GenerateData[types.AIEmailInferenceResult](ctx, s.genkit,
		ai.WithPrompt(prompt))
	if err != nil {
		return nil, fmt.Errorf("AI generation failed: %w", err)
	}

	return result, nil
}

// ConvertAIResultToTyped converts AI result to typed structures with DateTime
func (s *EmailInferenceService) ConvertAIResultToTyped(aiResult *types.AIEmailInferenceResult) (*types.EmailInferenceResponse, error) {
	result := &types.EmailInferenceResponse{
		Transportations: make([]types.TransportationInferred, 0),
		Lodgings:        make([]types.LodgingInferred, 0),
		Activities:      make([]types.ActivityInferred, 0),
	}

	// Convert transportations
	for _, t := range aiResult.Transportations {
		departure, err := time.Parse(time.RFC3339, t.Departure)
		if err != nil {
			return nil, fmt.Errorf("invalid departure time %s: %w", t.Departure, err)
		}
		arrival, err := time.Parse(time.RFC3339, t.Arrival)
		if err != nil {
			return nil, fmt.Errorf("invalid arrival time %s: %w", t.Arrival, err)
		}

		metadata := make(map[string]any)
		if t.FlightNumber != "" {
			metadata["flightNumber"] = t.FlightNumber
		}
		if t.Airline != "" {
			metadata["airline"] = t.Airline
		}
		if t.ConfirmationCode != "" {
			metadata["confirmationCode"] = t.ConfirmationCode
		}
		if t.SeatNumber != "" {
			metadata["seatNumber"] = t.SeatNumber
		}
		if t.TerminalInfo != "" {
			metadata["terminalInfo"] = t.TerminalInfo
		}
		if t.RentalCompany != "" {
			metadata["rentalCompany"] = t.RentalCompany
		}
		if t.VehicleType != "" {
			metadata["vehicleType"] = t.VehicleType
		}

		var cost *types.Cost
		if t.CostValue > 0 && t.Currency != "" {
			cost = &types.Cost{
				Value:    t.CostValue,
				Currency: t.Currency,
			}
		}

		departureDateTime, _ := pb_types.ParseDateTime(departure)
		arrivalDateTime, _ := pb_types.ParseDateTime(arrival)

		result.Transportations = append(result.Transportations, types.TransportationInferred{
			Type:        t.Type,
			Origin:      t.Origin,
			Destination: t.Destination,
			Departure:   departureDateTime,
			Arrival:     arrivalDateTime,
			Cost:        cost,
			Metadata:    metadata,
		})
	}

	// Convert lodgings
	for _, l := range aiResult.Lodgings {
		startDate, err := time.Parse(time.RFC3339, l.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start date %s: %w", l.StartDate, err)
		}
		endDate, err := time.Parse(time.RFC3339, l.EndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid end date %s: %w", l.EndDate, err)
		}

		metadata := make(map[string]any)
		if l.RoomType != "" {
			metadata["roomType"] = l.RoomType
		}
		if l.CheckInTime != "" {
			metadata["checkInTime"] = l.CheckInTime
		}
		if l.CheckOutTime != "" {
			metadata["checkOutTime"] = l.CheckOutTime
		}
		if l.GuestName != "" {
			metadata["guestName"] = l.GuestName
		}
		if l.PhoneNumber != "" {
			metadata["phoneNumber"] = l.PhoneNumber
		}

		var cost *types.Cost
		if l.CostValue > 0 && l.Currency != "" {
			cost = &types.Cost{
				Value:    l.CostValue,
				Currency: l.Currency,
			}
		}

		startDateTime, _ := pb_types.ParseDateTime(startDate)
		endDateTime, _ := pb_types.ParseDateTime(endDate)

		result.Lodgings = append(result.Lodgings, types.LodgingInferred{
			Type:             l.Type,
			Name:             l.Name,
			Address:          l.Address,
			StartDate:        startDateTime,
			EndDate:          endDateTime,
			ConfirmationCode: l.ConfirmationCode,
			Cost:             cost,
			Metadata:         metadata,
		})
	}

	// Convert activities
	for _, a := range aiResult.Activities {
		startDate, err := time.Parse(time.RFC3339, a.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start date %s: %w", a.StartDate, err)
		}

		var endDate time.Time
		var endDateTime pb_types.DateTime
		if a.EndDate != "" {
			endDate, err = time.Parse(time.RFC3339, a.EndDate)
			if err != nil {
				return nil, fmt.Errorf("invalid end date %s: %w", a.EndDate, err)
			}
			endDateTime, _ = pb_types.ParseDateTime(endDate)
		}

		metadata := make(map[string]any)
		if a.Category != "" {
			metadata["category"] = a.Category
		}
		if a.Duration != "" {
			metadata["duration"] = a.Duration
		}
		if a.ParticipantCount > 0 {
			metadata["participantCount"] = a.ParticipantCount
		}

		var cost *types.Cost
		if a.CostValue > 0 && a.Currency != "" {
			cost = &types.Cost{
				Value:    a.CostValue,
				Currency: a.Currency,
			}
		}

		startDateTime, _ := pb_types.ParseDateTime(startDate)

		activity := types.ActivityInferred{
			Name:             a.Name,
			Description:      a.Description,
			Address:          a.Address,
			StartDate:        startDateTime,
			ConfirmationCode: a.ConfirmationCode,
			Cost:             cost,
			Metadata:         metadata,
		}

		if !endDate.IsZero() {
			activity.EndDate = endDateTime
		}

		result.Activities = append(result.Activities, activity)
	}

	return result, nil
}

// FindAssociatedTrip finds a trip that matches the dates from the inferred data
func (s *EmailInferenceService) FindAssociatedTrip(ctx context.Context, userEmail string, inferredData *types.EmailInferenceResponse) (*core.Record, error) {
	// Find the user by email
	userRecord, err := s.app.FindAuthRecordByEmail("users", userEmail)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Extract all dates from inferred data
	var dates []time.Time
	for _, t := range inferredData.Transportations {
		dates = append(dates, t.Departure.Time(), t.Arrival.Time())
	}
	for _, l := range inferredData.Lodgings {
		dates = append(dates, l.StartDate.Time(), l.EndDate.Time())
	}
	for _, a := range inferredData.Activities {
		dates = append(dates, a.StartDate.Time())
		endTime := a.EndDate.Time()
		if !endTime.IsZero() {
			dates = append(dates, endTime)
		}
	}

	if len(dates) == 0 {
		return nil, fmt.Errorf("no dates found in inferred data")
	}

	// Find the min and max dates
	minDate := dates[0]
	maxDate := dates[0]
	for _, d := range dates {
		if d.Before(minDate) {
			minDate = d
		}
		if d.After(maxDate) {
			maxDate = d
		}
	}

	// Query trips where user has access (owner or collaborator) and dates overlap
	// A trip overlaps if: trip.startDate <= maxDate AND trip.endDate >= minDate
	query := s.app.DB().
		Select("trips.*").
		From("trips").
		LeftJoin("trips_collaborators", dbx.NewExp("trips.id = trips_collaborators.tripId")).
		Where(dbx.Or(
			dbx.HashExp{"trips.ownerId": userRecord.Id},
			dbx.HashExp{"trips_collaborators.userId": userRecord.Id},
		)).
		AndWhere(dbx.NewExp("trips.startDate <= {:maxDate}", dbx.Params{"maxDate": maxDate.Format(time.RFC3339)})).
		AndWhere(dbx.NewExp("trips.endDate >= {:minDate}", dbx.Params{"minDate": minDate.Format(time.RFC3339)})).
		OrderBy("trips.startDate ASC").
		Limit(1)

	var tripData map[string]any
	if err := query.One(&tripData); err != nil {
		return nil, fmt.Errorf("no matching trip found: %w", err)
	}

	// Load the trip collection and create record
	collection, err := s.app.FindCollectionByNameOrId("trips")
	if err != nil {
		return nil, fmt.Errorf("failed to find trips collection: %w", err)
	}

	trip := core.NewRecord(collection)
	trip.Load(tripData)

	return trip, nil
}

// AddRecordsToTrip adds transportation, lodging, and activity records to a trip
func (s *EmailInferenceService) AddRecordsToTrip(ctx context.Context, tripID string, data *types.EmailInferenceResponse) error {
	return s.app.RunInTransaction(func(txApp core.App) error {
		// Add transportations
		transportCollection, err := txApp.FindCollectionByNameOrId("transportations")
		if err != nil {
			return fmt.Errorf("failed to find transportations collection: %w", err)
		}

		for _, t := range data.Transportations {
			record := core.NewRecord(transportCollection)
			record.Set("trip", tripID)
			record.Set("type", t.Type)
			record.Set("origin", t.Origin)
			record.Set("destination", t.Destination)
			record.Set("departureTime", t.Departure)
			record.Set("arrivalTime", t.Arrival)
			if t.Cost != nil {
				record.Set("cost", t.Cost)
			}
			if len(t.Metadata) > 0 {
				record.Set("metadata", t.Metadata)
			}

			if err := txApp.Save(record); err != nil {
				return fmt.Errorf("failed to save transportation: %w", err)
			}
		}

		// Add lodgings
		lodgingCollection, err := txApp.FindCollectionByNameOrId("lodgings")
		if err != nil {
			return fmt.Errorf("failed to find lodgings collection: %w", err)
		}

		for _, l := range data.Lodgings {
			record := core.NewRecord(lodgingCollection)
			record.Set("trip", tripID)
			record.Set("type", l.Type)
			record.Set("name", l.Name)
			record.Set("address", l.Address)
			record.Set("startDate", l.StartDate)
			record.Set("endDate", l.EndDate)
			if l.ConfirmationCode != "" {
				record.Set("confirmationCode", l.ConfirmationCode)
			}
			if l.Cost != nil {
				record.Set("cost", l.Cost)
			}
			if len(l.Metadata) > 0 {
				record.Set("metadata", l.Metadata)
			}

			if err := txApp.Save(record); err != nil {
				return fmt.Errorf("failed to save lodging: %w", err)
			}
		}

		// Add activities
		activityCollection, err := txApp.FindCollectionByNameOrId("activities")
		if err != nil {
			return fmt.Errorf("failed to find activities collection: %w", err)
		}

		for _, a := range data.Activities {
			record := core.NewRecord(activityCollection)
			record.Set("trip", tripID)
			record.Set("name", a.Name)
			if a.Description != "" {
				record.Set("description", a.Description)
			}
			if a.Address != "" {
				record.Set("address", a.Address)
			}
			record.Set("startDate", a.StartDate)
			endTime := a.EndDate.Time()
			if !endTime.IsZero() {
				record.Set("endDate", a.EndDate)
			}
			if a.ConfirmationCode != "" {
				record.Set("confirmationCode", a.ConfirmationCode)
			}
			if a.Cost != nil {
				record.Set("cost", a.Cost)
			}
			if len(a.Metadata) > 0 {
				record.Set("metadata", a.Metadata)
			}

			if err := txApp.Save(record); err != nil {
				return fmt.Errorf("failed to save activity: %w", err)
			}
		}

		return nil
	})
}

func init() {
	// Initialize genkit
	genkit.Init(context.Background(), nil)
}
