package routes

import (
	bt "backend/types"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	ics "github.com/arran4/golang-ical"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/samber/lo"
)

func GenerateIcsData(e *core.RequestEvent) error {
	// Get the trip record
	tripRecord := e.Get("trip").(*core.Record)

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

	allTimezonesAvailable := true

	// Create calendar
	cal := ics.NewCalendar()
	cal.SetMethod(ics.MethodPublish)

	// Add a trip as a full-day event, not busy
	addFullDatTripEvent(e, cal, &trip)

	// Add transportation events
	for _, transportation := range transportations {
		timezoneOk := addTransportationEvent(cal, transportation, &trip, e)
		allTimezonesAvailable = allTimezonesAvailable && timezoneOk
	}

	// Add lodging events
	for _, lodging := range lodgings {
		timezoneOk := createLodgingEvent(cal, lodging, &trip, e)
		allTimezonesAvailable = allTimezonesAvailable && timezoneOk

	}

	// Add activity events (1 hr with end date)
	for _, activity := range activities {
		timezoneOk := createActivityEvent(cal, activity, &trip, e)
		allTimezonesAvailable = allTimezonesAvailable && timezoneOk

	}

	base64Str := base64.StdEncoding.EncodeToString([]byte(cal.Serialize()))
	return e.JSON(http.StatusOK, map[string]interface{}{
		"data":                  base64Str,
		"allTimezonesAvailable": allTimezonesAvailable,
	})
}

func createActivityEvent(cal *ics.Calendar, activity *bt.Activity, trip *bt.Trip, e *core.RequestEvent) bool {

	timezoneAvailable := true

	activityEvent := cal.AddEvent(fmt.Sprintf("activity-%s@surmai.app", activity.Id))
	activityEvent.SetCreatedTime(time.Now())
	activityEvent.SetDtStampTime(time.Now())
	activityEvent.SetSummary(activity.Name)
	activityEvent.SetDescription(activity.Description)
	activityEvent.SetLocation(activity.Address)

	if activity.Link != "" {
		activityEvent.SetURL(activity.Link)
	} else {
		activityEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)
	}

	metadata := activity.Metadata
	placeTz := getTimezoneValue(metadata, "place")

	if placeTz != "" {
		timezoneAvailable = false
	}

	startDate := applyActualTimezone(activity.StartDate.Time(), placeTz)
	activityEvent.SetStartAt(startDate)

	if activity.EndDate.IsZero() {
		activityEvent.SetEndAt(startDate.Add(1 * time.Hour))
	} else {
		endDate := applyActualTimezone(activity.EndDate.Time(), placeTz)
		activityEvent.SetEndAt(endDate)
	}

	return timezoneAvailable
}

func createLodgingEvent(cal *ics.Calendar, lodging *bt.Lodging, trip *bt.Trip, e *core.RequestEvent) bool {

	timezoneAvailable := true

	// Check-in event (30 min)
	checkInEvent := cal.AddEvent(fmt.Sprintf("lodging-checkin-%s@surmai.app", lodging.Id))
	checkInEvent.SetCreatedTime(time.Now())
	checkInEvent.SetDtStampTime(time.Now())
	checkInEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)

	metadata := lodging.Metadata
	placeTz := getTimezoneValue(metadata, "place")

	if placeTz == "" {
		timezoneAvailable = false
	}

	checkInTime := applyActualTimezone(lodging.StartDate.Time(), placeTz)
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
	stayEvent.SetTimeTransparency(ics.TransparencyTransparent) // Not busy

	if lodging.Link != "" {
		stayEvent.SetURL(lodging.Link)
	} else {
		stayEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)
	}

	// Check-out event (30 min)
	checkOutEvent := cal.AddEvent(fmt.Sprintf("lodging-checkout-%s@surmai.app", lodging.Id))
	checkOutEvent.SetCreatedTime(time.Now())
	checkOutEvent.SetDtStampTime(time.Now())

	checkOutTime := applyActualTimezone(lodging.EndDate.Time(), placeTz)
	checkOutEvent.SetStartAt(checkOutTime)
	checkOutEvent.SetEndAt(checkOutTime.Add(30 * time.Minute))
	checkOutEvent.SetSummary(fmt.Sprintf("Check-out: %s", lodging.Name))
	checkOutEvent.SetLocation(lodging.Address)
	checkOutEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)

	return timezoneAvailable

}

func addTransportationEvent(cal *ics.Calendar, transportation *bt.Transportation, trip *bt.Trip, e *core.RequestEvent) bool {

	timezoneAvailable := true

	transportEvent := cal.AddEvent(fmt.Sprintf("transport-%s@surmai.app", transportation.Id))
	transportEvent.SetCreatedTime(time.Now())
	transportEvent.SetDtStampTime(time.Now())
	if transportation.Link != "" {
		transportEvent.SetURL(transportation.Link)
	} else {
		transportEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)
	}

	metadata := transportation.Metadata

	provider := metadata["provider"]
	reservation := metadata["reservation"]
	originAddress := metadata["originAddress"]
	destinationAddress := metadata["destinationAddress"]

	departureTz := getTimezoneValue(metadata, "origin")
	if departureTz == "" {
		timezoneAvailable = false
	}

	departureTime := applyActualTimezone(transportation.Departure.Time(), departureTz)
	transportEvent.SetStartAt(departureTime)

	arrivalTz := getTimezoneValue(metadata, "destination")
	if arrivalTz == "" {
		timezoneAvailable = false
	}
	arrivalTime := applyActualTimezone(transportation.Arrival.Time(), arrivalTz)
	transportEvent.SetEndAt(arrivalTime)

	eventDescription := make([]string, 0)

	if provider != nil && transportation.Type == "flight" {

		providerMap, ok := provider.(map[string]interface{})

		if !ok {
			eventDescription = append(eventDescription, fmt.Sprintf("Airline: %s", provider))
		} else {
			providerName := providerMap["name"].(string)
			eventDescription = append(eventDescription, fmt.Sprintf("Airline: %s", providerName))
		}

	} else if provider != "" {
		eventDescription = append(eventDescription, fmt.Sprintf("Provider: %s", provider))
	}

	if reservation != "" && transportation.Type == "flight" {
		eventDescription = append(eventDescription, fmt.Sprintf("Confirmation Code: %s", reservation))
	} else if reservation != "" {
		eventDescription = append(eventDescription, fmt.Sprintf("Reservation: %s", reservation))
	}

	if transportation.Type == "rental_car" {
		days := int64(arrivalTime.Sub(departureTime).Hours() / 24.0)
		summary := fmt.Sprintf("Car Rental for %d day(s)", days)
		transportEvent.SetSummary(summary)
		transportEvent.SetLocation(transportation.Origin)

		if originAddress != nil {
			eventDescription = append(eventDescription, fmt.Sprintf("Pickup Address: %s", originAddress))
		}

		if destinationAddress != nil {
			eventDescription = append(eventDescription, fmt.Sprintf("Drop Off Address: %s", destinationAddress))
		}

	} else {
		summary := fmt.Sprintf("%s from %s to %s", lo.Capitalize(transportation.Type), transportation.Origin, transportation.Destination)
		transportEvent.SetSummary(summary)

		if originAddress != nil {
			eventDescription = append(eventDescription, fmt.Sprintf("Origin Address: %s", originAddress))
		}

		if destinationAddress != nil {
			eventDescription = append(eventDescription, fmt.Sprintf("Destination Address: %s", destinationAddress))
		}
	}

	transportEvent.SetDescription(strings.Join(eventDescription[:], "\n"))

	return timezoneAvailable

}

func addFullDatTripEvent(e *core.RequestEvent, cal *ics.Calendar, trip *bt.Trip) {
	tripEvent := cal.AddEvent(fmt.Sprintf("trip-%s@surmai.app", trip.Id))
	tripEvent.SetCreatedTime(time.Now())
	tripEvent.SetDtStampTime(time.Now())
	tripEvent.SetModifiedAt(time.Now())
	tripEvent.SetAllDayStartAt(trip.StartDate.Time())
	tripEvent.SetAllDayEndAt(trip.EndDate.Time())
	tripEvent.SetSummary(trip.Name)
	tripEvent.SetDescription(trip.Description)

	tripEvent.SetURL(e.App.Settings().Meta.AppURL + "/trips/" + trip.Id)
	tripEvent.SetTimeTransparency(ics.TransparencyTransparent) // Not busy
}

// Helper functions to extract data from trip record
func getDestinations(trip *core.Record) []bt.Destination {
	var destinations []bt.Destination
	destinationsString := trip.GetString("destinations")
	_ = json.Unmarshal([]byte(destinationsString), &destinations)
	return destinations
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
			Link:             l.GetString("link"),
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
			Link:             l.GetString("link"),
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
			Link:        l.GetString("link"),
		}
		_ = l.UnmarshalJSONField("metadata", &ct.Metadata)
		_ = l.UnmarshalJSONField("cost", &ct.Cost)
		payload = append(payload, &ct)
	}

	return payload
}

func applyActualTimezone(t time.Time, timeZone string) time.Time {

	if timeZone == "" {
		return t
	}

	loc, err := time.LoadLocation(timeZone)
	if err != nil {
		return t
	}

	locTime := t.In(loc)
	_, zoneOffset := locTime.Zone()
	inZoneTime := locTime.Add(-time.Duration(zoneOffset) * time.Second)
	return inZoneTime
}

func getTimezoneValue(metadata map[string]interface{}, key string) string {

	if metadata == nil || metadata[key] == nil || metadata[key] == "" {
		return ""
	}

	place := metadata[key].(map[string]interface{})
	if place == nil || place["timezone"] == nil {
		return ""
	}

	return place["timezone"].(string)
}
