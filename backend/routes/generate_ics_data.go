package routes

import (
	bt "backend/types"
	"encoding/base64"
	"encoding/json"
	"fmt"
	ics "github.com/arran4/golang-ical"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/samber/lo"
	"net/http"
	"strings"
	"time"
)

func GenerateIcsData(e *core.RequestEvent) error {
	// Get the trip record
	tripRecord := e.Get("trip").(*core.Record)
	user := e.Auth

	timeZone := user.GetString("timezone")
	fmt.Println(timeZone)
	// Convert the trip record to Trip type
	trip := bt.Trip{
		Id:           tripRecord.Id,
		Name:         tripRecord.GetString("name"),
		Description:  tripRecord.GetString("description"),
		StartDate:    tripRecord.GetDateTime("startDate"),
		EndDate:      tripRecord.GetDateTime("endDate"),
		Destinations: getDestinations(tripRecord),
	}

	// Get transportations, lodgings, and activities
	transportations := exportTransportations(e.App, tripRecord)
	lodgings := exportLodgings(e.App, tripRecord)
	activities := exportActivities(e.App, tripRecord)

	// Set response header
	//e.Response.Header().Set("Content-Type", "text/calendar")

	// Create calendar
	cal := ics.NewCalendar()
	cal.SetMethod(ics.MethodPublish)
	//cal.SetTimezoneId()

	// Add trip as full day event, not busy
	tripEvent := cal.AddEvent(fmt.Sprintf("trip-%s@surmai.app", trip.Id))
	tripEvent.SetCreatedTime(time.Now())
	tripEvent.SetDtStampTime(time.Now())
	tripEvent.SetModifiedAt(time.Now())
	tripEvent.SetAllDayStartAt(trip.StartDate.Time())
	tripEvent.SetAllDayEndAt(trip.EndDate.Time())
	tripEvent.SetSummary(trip.Name)
	tripEvent.SetDescription(trip.Description)
	tripEvent.SetLocation(lo.Reduce(trip.Destinations, func(agg string, item bt.Destination, index int) string {
		return strings.TrimSpace(fmt.Sprintf("%s %s", agg, item.Name))
	}, ""))
	tripEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)
	tripEvent.SetTimeTransparency(ics.TransparencyTransparent) // Not busy

	// Add transportation events
	for _, transportation := range transportations {
		transportEvent := cal.AddEvent(fmt.Sprintf("transport-%s@surmai.app", transportation.Id))
		transportEvent.SetCreatedTime(time.Now())
		transportEvent.SetDtStampTime(time.Now())
		transportEvent.SetStartAt(transportation.Departure.Time())
		transportEvent.SetEndAt(transportation.Arrival.Time())
		summary := fmt.Sprintf("%s: %s to %s", transportation.Type, transportation.Origin, transportation.Destination)
		transportEvent.SetSummary(summary)
	}

	// Add lodging events
	for _, lodging := range lodgings {
		// Check-in event (30 min)
		checkInEvent := cal.AddEvent(fmt.Sprintf("lodging-checkin-%s@surmai.app", lodging.Id))
		checkInEvent.SetCreatedTime(time.Now())
		checkInEvent.SetDtStampTime(time.Now())
		checkInTime := lodging.StartDate.Time()
		checkInEvent.SetStartAt(checkInTime)
		checkInEvent.SetEndAt(checkInTime.Add(30 * time.Minute))
		checkInEvent.SetSummary(fmt.Sprintf("Check-in: %s", lodging.Name))
		checkInEvent.SetLocation(lodging.Address)

		// Stay event (full day)
		stayEvent := cal.AddEvent(fmt.Sprintf("lodging-stay-%s@surmai.app", lodging.Id))
		stayEvent.SetCreatedTime(time.Now())
		stayEvent.SetDtStampTime(time.Now())
		stayEvent.SetAllDayStartAt(lodging.StartDate.Time())
		stayEvent.SetAllDayEndAt(lodging.EndDate.Time())
		stayEvent.SetSummary(fmt.Sprintf("Stay: %s", lodging.Name))
		stayEvent.SetLocation(lodging.Address)

		// Check-out event (30 min)
		checkOutEvent := cal.AddEvent(fmt.Sprintf("lodging-checkout-%s@surmai.app", lodging.Id))
		checkOutEvent.SetCreatedTime(time.Now())
		checkOutEvent.SetDtStampTime(time.Now())
		checkOutTime := lodging.EndDate.Time()
		checkOutEvent.SetStartAt(checkOutTime)
		checkOutEvent.SetEndAt(checkOutTime.Add(30 * time.Minute))
		checkOutEvent.SetSummary(fmt.Sprintf("Check-out: %s", lodging.Name))
		checkOutEvent.SetLocation(lodging.Address)
	}

	// Add activity events (1 hr with end date)
	for _, activity := range activities {
		activityEvent := cal.AddEvent(fmt.Sprintf("activity-%s@surmai.app", activity.Id))
		activityEvent.SetCreatedTime(time.Now())
		activityEvent.SetDtStampTime(time.Now())
		startTime := activity.StartDate.Time()
		activityEvent.SetStartAt(startTime)
		activityEvent.SetEndAt(startTime.Add(1 * time.Hour)) // 1 hour duration
		activityEvent.SetSummary(activity.Name)
		activityEvent.SetDescription(activity.Description)
		activityEvent.SetLocation(activity.Address)
	}

	base64Str := base64.StdEncoding.EncodeToString([]byte(cal.Serialize()))
	return e.JSON(http.StatusOK, map[string]string{
		"data": base64Str,
	})
}

// Helper functions to extract data from trip record

func getDestinations(trip *core.Record) []bt.Destination {
	var destinations []bt.Destination
	destinationsString := trip.GetString("destinations")
	_ = json.Unmarshal([]byte(destinationsString), &destinations)
	return destinations
}

func getParticipants(trip *core.Record) []bt.Participant {
	var participants []bt.Participant
	participantNames := trip.GetStringSlice("participants")

	for _, name := range participantNames {
		participants = append(participants, bt.Participant{
			Name: name,
		})
	}

	return participants
}

func exportActivities(e core.App, trip *core.Record) []*bt.Activity {
	activities, _ := e.FindAllRecords("activities",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Activity
	for _, l := range activities {
		ct := bt.Activity{
			Id:               l.Id,
			Name:             l.GetString("name"),
			Description:      l.GetString("description"),
			Address:          l.GetString("address"),
			StartDate:        l.GetDateTime("startDate"),
			ConfirmationCode: l.GetString("confirmationCode"),
		}
		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
	}

	return payload
}

func exportLodgings(e core.App, trip *core.Record) []*bt.Lodging {
	lodgings, _ := e.FindAllRecords("lodgings",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Lodging
	for _, l := range lodgings {
		ct := bt.Lodging{
			Id:               l.Id,
			Name:             l.GetString("name"),
			Address:          l.GetString("address"),
			StartDate:        l.GetDateTime("startDate"),
			EndDate:          l.GetDateTime("endDate"),
			ConfirmationCode: l.GetString("confirmationCode"),
			Type:             l.GetString("type"),
		}
		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
	}

	return payload
}

func exportTransportations(e core.App, trip *core.Record) []*bt.Transportation {
	transportations, _ := e.FindAllRecords("transportations",
		dbx.NewExp("trip = {:tripId}", dbx.Params{"tripId": trip.Id}))

	var payload []*bt.Transportation
	for _, l := range transportations {
		ct := bt.Transportation{
			Id:          l.Id,
			Type:        l.GetString("type"),
			Origin:      l.GetString("origin"),
			Destination: l.GetString("destination"),
			Departure:   l.GetDateTime("departureTime"),
			Arrival:     l.GetDateTime("arrivalTime"),
		}
		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
	}

	return payload
}
