package trips

// Readers that turn a trip's records into the exported types. They are shared
// by the trip archive export and the calendar (ICS) route, which previously
// kept its own near-identical copies.

import (
	bt "backend/types"
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func byTrip(trip *core.Record) dbx.Expression {
	return dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id})
}

// unmarshalField reads a JSON field into target. A field holding something
// other than the expected shape is reported and skipped rather than failing the
// whole export, since one malformed record should not make a trip unexportable.
func unmarshalField(app core.App, trip *core.Record, field string, target any) {
	raw := trip.GetString(field)
	if raw == "" {
		return
	}
	if err := json.Unmarshal([]byte(raw), target); err != nil {
		app.Logger().Error("Could not read trip field", "trip", trip.Id, "field", field, "error", err)
	}
}

// Destinations returns the trip's destinations.
func Destinations(app core.App, trip *core.Record) []bt.Destination {
	var destinations []bt.Destination
	unmarshalField(app, trip, "destinations", &destinations)
	return destinations
}

// Participants returns the trip's participants.
func Participants(app core.App, trip *core.Record) []bt.Participant {
	var participants []bt.Participant
	unmarshalField(app, trip, "participants", &participants)
	return participants
}

// Activities returns the trip's activities.
func Activities(app core.App, trip *core.Record) []*bt.Activity {
	records, _ := app.FindAllRecords("activities", byTrip(trip))

	var payload []*bt.Activity
	for _, r := range records {
		item := bt.Activity{
			Id:                   r.Id,
			Name:                 r.GetString("name"),
			Description:          r.GetString("description"),
			Address:              r.GetString("address"),
			StartDate:            r.GetDateTime("startDate"),
			EndDate:              r.GetDateTime("endDate"),
			ConfirmationCode:     r.GetString("confirmationCode"),
			AttachmentReferences: r.GetStringSlice("attachmentReferences"),
			Link:                 r.GetString("link"),
			ExpenseId:            r.GetString("expenseId"),
			Travellers:           r.GetStringSlice("travellers"),
		}
		_ = r.UnmarshalJSONField("metadata", &item.Metadata)
		_ = r.UnmarshalJSONField("cost", &item.Cost)
		payload = append(payload, &item)
	}

	return payload
}

// Lodgings returns the trip's lodgings.
func Lodgings(app core.App, trip *core.Record) []*bt.Lodging {
	records, _ := app.FindAllRecords("lodgings", byTrip(trip))

	var payload []*bt.Lodging
	for _, r := range records {
		item := bt.Lodging{
			Id:                   r.Id,
			Type:                 r.GetString("type"),
			Name:                 r.GetString("name"),
			Address:              r.GetString("address"),
			StartDate:            r.GetDateTime("startDate"),
			EndDate:              r.GetDateTime("endDate"),
			ConfirmationCode:     r.GetString("confirmationCode"),
			AttachmentReferences: r.GetStringSlice("attachmentReferences"),
			Link:                 r.GetString("link"),
			ExpenseId:            r.GetString("expenseId"),
			Travellers:           r.GetStringSlice("travellers"),
		}
		_ = r.UnmarshalJSONField("metadata", &item.Metadata)
		_ = r.UnmarshalJSONField("cost", &item.Cost)
		payload = append(payload, &item)
	}

	return payload
}

// Transportations returns the trip's transportations.
func Transportations(app core.App, trip *core.Record) []*bt.Transportation {
	records, _ := app.FindAllRecords("transportations", byTrip(trip))

	var payload []*bt.Transportation
	for _, r := range records {
		item := bt.Transportation{
			Id:                   r.Id,
			Type:                 r.GetString("type"),
			Origin:               r.GetString("origin"),
			Destination:          r.GetString("destination"),
			Departure:            r.GetDateTime("departureTime"),
			Arrival:              r.GetDateTime("arrivalTime"),
			AttachmentReferences: r.GetStringSlice("attachmentReferences"),
			Link:                 r.GetString("link"),
			ExpenseId:            r.GetString("expenseId"),
			Travellers:           r.GetStringSlice("travellers"),
		}
		_ = r.UnmarshalJSONField("metadata", &item.Metadata)
		_ = r.UnmarshalJSONField("cost", &item.Cost)
		payload = append(payload, &item)
	}

	return payload
}

// Expenses returns the trip's expenses.
func Expenses(app core.App, trip *core.Record) []*bt.Expense {
	records, _ := app.FindAllRecords("trip_expenses", byTrip(trip))

	var payload []*bt.Expense
	for _, r := range records {
		item := bt.Expense{
			Id:                   r.Id,
			Name:                 r.GetString("name"),
			OccurredOn:           r.GetDateTime("occurredOn"),
			Notes:                r.GetString("notes"),
			Category:             r.GetString("category"),
			AttachmentReferences: r.GetStringSlice("attachmentReferences"),
		}
		_ = r.UnmarshalJSONField("cost", &item.Cost)
		payload = append(payload, &item)
	}

	return payload
}
