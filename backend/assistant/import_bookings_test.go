package assistant_test

import (
	"backend/assistant"
	"backend/testutil"
	bt "backend/types"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// A booking is attached to the trip that spans its dates, so the fixtures all
// sit inside this window.
func tripForBookings(t testing.TB, app *tests.TestApp, owner *core.Record) *core.Record {
	t.Helper()

	return testutil.CreateTrip(t, app, owner, map[string]any{
		"name":      "Paris in June",
		"startDate": "2026-06-01 00:00:00.000Z",
		"endDate":   "2026-06-30 00:00:00.000Z",
		"destinations": []map[string]any{
			{"id": "paris", "name": "Paris", "countryName": "France", "timezone": "Europe/Paris"},
		},
	})
}

func bookingEmail() *bt.Email {
	return &bt.Email{
		MessageId: "message-1",
		From:      "traveller@example.com",
		Subject:   "Your booking",
		TextBody:  "Confirmed",
	}
}

func onlyRecord(t testing.TB, app *tests.TestApp, collection string) *core.Record {
	t.Helper()

	records, err := app.FindAllRecords(collection)
	if err != nil {
		t.Fatal(err)
	}
	if len(records) != 1 {
		t.Fatalf("got %d %s, want 1", len(records), collection)
	}
	return records[0]
}

func TestProcessAccommodations(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	trip := tripForBookings(t, app, user)

	assistant.ProcessAccommodations(app, bookingEmail(), user, []*bt.EmailHotelInfo{{
		Name:             "Hotel Rivoli",
		Type:             "hotel",
		ConfirmationCode: "ABC123",
		Address:          "12 Rue de Rivoli, Paris, France",
		CheckInDate:      "2026-06-02 15:00:00.000Z",
		CheckOutDate:     "2026-06-05 11:00:00.000Z",
		Link:             "https://example.com/booking",
		Cost:             bt.Cost{Value: 800, Currency: "EUR"},
	}})

	lodging := onlyRecord(t, app, "lodgings")
	if got := lodging.GetString("trip"); got != trip.Id {
		t.Errorf("trip = %q, want the matching trip %q", got, trip.Id)
	}
	for field, want := range map[string]string{
		"name":             "Hotel Rivoli",
		"type":             "hotel",
		"confirmationCode": "ABC123",
		"address":          "12 Rue de Rivoli, Paris, France",
		"link":             "https://example.com/booking",
	} {
		if got := lodging.GetString(field); got != want {
			t.Errorf("%s = %q, want %q", field, got, want)
		}
	}
	if got := lodging.GetDateTime("startDate").String(); got != "2026-06-02 15:00:00.000Z" {
		t.Errorf("startDate = %q", got)
	}

	// a cost creates a linked expense on the same trip
	expense, err := app.FindRecordById("trip_expenses", lodging.GetString("expenseId"))
	if err != nil {
		t.Fatalf("no expense was linked: %v", err)
	}
	if got := expense.GetString("trip"); got != trip.Id {
		t.Errorf("expense trip = %q, want %q", got, trip.Id)
	}
}

func TestProcessAccommodationsWithoutACost(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessAccommodations(app, bookingEmail(), user, []*bt.EmailHotelInfo{{
		Name: "Friend's spare room", Type: "home", Address: "Paris",
		CheckInDate:  "2026-06-02 15:00:00.000Z",
		CheckOutDate: "2026-06-05 11:00:00.000Z",
	}})

	lodging := onlyRecord(t, app, "lodgings")
	if got := lodging.GetString("expenseId"); got != "" {
		t.Errorf("expenseId = %q, want none for a free stay", got)
	}
	count, _ := app.CountRecords("trip_expenses")
	if count != 0 {
		t.Errorf("created %d expenses, want none", count)
	}
}

func TestProcessFlights(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	trip := tripForBookings(t, app, user)
	testutil.CreateRecord(t, app, "airlines", map[string]any{"name": "Air France", "code": "AF"})

	assistant.ProcessFlights(app, bookingEmail(), user, []*bt.EmailFlightInfo{{
		FlightNumber:         "AF007",
		ConfirmationCode:     "XYZ789",
		DepartureAirportCode: "JFK",
		ArrivalAirportCode:   "CDG",
		DepartureDate:        "2026-06-01 18:00:00.000Z",
		ArrivalDate:          "2026-06-02 07:00:00.000Z",
		Cost:                 bt.Cost{Value: 420, Currency: "EUR"},
		Seats:                "14C",
		Airline:              bt.Airline{Name: "Air France", Code: "AF"},
	}})

	transportation := onlyRecord(t, app, "transportations")
	if got := transportation.GetString("trip"); got != trip.Id {
		t.Errorf("trip = %q, want %q", got, trip.Id)
	}
	if got := transportation.GetString("type"); got != "flight" {
		t.Errorf("type = %q, want flight", got)
	}
	if got := transportation.GetString("origin"); got != "JFK" {
		t.Errorf("origin = %q, want JFK", got)
	}
	if got := transportation.GetString("destination"); got != "CDG" {
		t.Errorf("destination = %q, want CDG", got)
	}
}

func TestProcessTransportations(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessTransportations(app, bookingEmail(), user, []*bt.EmailTransportationInfo{{
		TransportationType: "train",
		ConfirmationCode:   "TR-1",
		DepartureLocation:  "Paris Gare du Nord",
		ArrivalLocation:    "Brussels Midi",
		StartTime:          "2026-06-03 09:00:00.000Z",
		EndTime:            "2026-06-03 11:00:00.000Z",
		Cost:               bt.Cost{Value: 60, Currency: "EUR"},
	}})

	transportation := onlyRecord(t, app, "transportations")
	if got := transportation.GetString("type"); got != "train" {
		t.Errorf("type = %q, want train", got)
	}
	if got := transportation.GetString("origin"); got != "Paris Gare du Nord" {
		t.Errorf("origin = %q", got)
	}
}

func TestProcessCarRentals(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessCarRentals(app, bookingEmail(), user, []*bt.EmailCarRentalInfo{{
		ReservationID:   "CR-1",
		RentalCompany:   "Hertz",
		PickupLocation:  "CDG Airport",
		DropoffLocation: "CDG Airport",
		PickupDateTime:  "2026-06-02 10:00:00.000Z",
		DropoffDateTime: "2026-06-04 10:00:00.000Z",
		Cost:            bt.Cost{Value: 150, Currency: "EUR"},
	}})

	transportation := onlyRecord(t, app, "transportations")
	if got := transportation.GetString("type"); got != "rental_car" {
		t.Errorf("type = %q, want rental_car", got)
	}
	if got := transportation.GetString("origin"); got != "CDG Airport" {
		t.Errorf("origin = %q, want the pickup location", got)
	}
	if got := transportation.GetString("confirmationCode"); got != "" && got != "CR-1" {
		t.Errorf("confirmationCode = %q", got)
	}
}

func TestProcessActivities(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessActivities(app, bookingEmail(), user, []*bt.EmailActivityInfo{{
		Name:             "Louvre guided tour",
		Description:      "Two hours",
		ConfirmationCode: "AC-1",
		Address:          "Rue de Rivoli, Paris",
		StartDate:        "2026-06-03 09:00:00.000Z",
		EndDate:          "2026-06-03 11:00:00.000Z",
		Cost:             bt.Cost{Value: 45, Currency: "EUR"},
	}})

	activity := onlyRecord(t, app, "activities")
	if got := activity.GetString("name"); got != "Louvre guided tour" {
		t.Errorf("name = %q", got)
	}
	if got := activity.GetString("confirmationCode"); got != "AC-1" {
		t.Errorf("confirmationCode = %q", got)
	}
}

func TestProcessParkings(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessParkings(app, bookingEmail(), user, []*bt.EmailParkingInfo{{
		ConfirmationCode: "PK-1",
		CompanyName:      "ParkPlus",
		Address:          "JFK Airport",
		StartTime:        "2026-06-01 16:00:00.000Z",
		EndTime:          "2026-06-10 10:00:00.000Z",
		Cost:             bt.Cost{Value: 90, Currency: "USD"},
		SpotNumber:       "A12",
	}})

	// parking is stored as a transportation entry
	transportation := onlyRecord(t, app, "transportations")
	if got := transportation.GetString("type"); got != "parking" {
		t.Errorf("type = %q, want parking", got)
	}
	if got := transportation.GetString("origin"); got != "JFK Airport" {
		t.Errorf("origin = %q, want the parking address", got)
	}
	if got := transportation.GetDateTime("departureTime").String(); got != "2026-06-01 16:00:00.000Z" {
		t.Errorf("departureTime = %q", got)
	}
}

// A booking that falls outside every trip has nowhere to go, and must not be
// attached to an unrelated trip or crash the import.
func TestBookingsOutsideAnyTripAreSkipped(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessAccommodations(app, bookingEmail(), user, []*bt.EmailHotelInfo{{
		Name: "Hotel Next Year", Type: "hotel", Address: "Paris",
		CheckInDate:  "2027-06-02 15:00:00.000Z",
		CheckOutDate: "2027-06-05 11:00:00.000Z",
		Cost:         bt.Cost{Value: 800, Currency: "EUR"},
	}})

	count, _ := app.CountRecords("lodgings")
	if count != 0 {
		t.Errorf("stored %d lodgings, want none for a booking outside the trip", count)
	}
}

// Another user's trip must never receive the booking.
func TestBookingsOnlyLandInTheRecipientsTrip(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	tripForBookings(t, app, owner)

	stranger := testutil.CreateUser(t, app, "stranger@example.com")
	assistant.ProcessAccommodations(app, bookingEmail(), stranger, []*bt.EmailHotelInfo{{
		Name: "Hotel Rivoli", Type: "hotel", Address: "Paris",
		CheckInDate:  "2026-06-02 15:00:00.000Z",
		CheckOutDate: "2026-06-05 11:00:00.000Z",
		Cost:         bt.Cost{Value: 800, Currency: "EUR"},
	}})

	count, _ := app.CountRecords("lodgings")
	if count != 0 {
		t.Errorf("stored %d lodgings in another user's trip, want none", count)
	}
}

// Dates the model could not read must be skipped rather than stored as zero.
func TestBookingsWithUnreadableDatesAreSkipped(t *testing.T) {
	app := testutil.NewApp(t)
	user := testutil.CreateUser(t, app, "traveller@example.com")
	tripForBookings(t, app, user)

	assistant.ProcessAccommodations(app, bookingEmail(), user, []*bt.EmailHotelInfo{{
		Name: "Hotel Rivoli", Type: "hotel", Address: "Paris",
		CheckInDate:  "sometime next week",
		CheckOutDate: "",
	}})

	count, _ := app.CountRecords("lodgings")
	if count != 0 {
		t.Errorf("stored %d lodgings, want none for unreadable dates", count)
	}
}

// A collaborator's booking lands in the shared trip too.
func TestBookingsFromACollaborator(t *testing.T) {
	app := testutil.NewApp(t)
	owner := testutil.CreateUser(t, app, "owner@example.com")
	collaborator := testutil.CreateUser(t, app, "collaborator@example.com")
	trip := testutil.CreateTrip(t, app, owner, map[string]any{
		"startDate":     "2026-06-01 00:00:00.000Z",
		"endDate":       "2026-06-30 00:00:00.000Z",
		"collaborators": []string{collaborator.Id},
		"destinations":  []map[string]any{},
	})

	assistant.ProcessAccommodations(app, bookingEmail(), collaborator, []*bt.EmailHotelInfo{{
		Name: "Hotel Rivoli", Type: "hotel", Address: "Paris",
		CheckInDate:  "2026-06-02 15:00:00.000Z",
		CheckOutDate: "2026-06-05 11:00:00.000Z",
	}})

	lodging := onlyRecord(t, app, "lodgings")
	if got := lodging.GetString("trip"); got != trip.Id {
		t.Errorf("trip = %q, want the shared trip %q", got, trip.Id)
	}
}
