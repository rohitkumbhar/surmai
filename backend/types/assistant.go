package types

import "time"

type EmailSyncConfig struct {
	Enabled            bool   `json:"enabled"`
	ImapHost           string `json:"imapHost"`
	ImapPort           int    `json:"imapPort"`
	ImapUser           string `json:"imapUser"`
	ImapPassword       string `json:"imapPassword"`
	FilterEmailAddress string `json:"filterEmailAddress"`
}

type OpenAiEndpointConfig struct {
	Enabled  bool   `json:"enabled"`
	Endpoint string `json:"endpoint"`
	ApiKey   string `json:"apiKey"`
	Model    string `json:"model"`
}

type EmailAttachment struct {
	Name     string
	FileType string
	Content  []byte
}

type Email struct {
	MessageId   string
	Uid         uint32
	From        string
	Subject     string
	Date        time.Time
	TextBody    string
	HTMLBody    string
	Attachments []EmailAttachment
}

type EmailPassenger struct {
	Name  string `json:"name,required"`
	Email string `json:"email"`
}

type EmailFlightInfo struct {
	FlightNumber         string           `json:"flight_number" jsonschema:"title=flightNumber,description=Flight number or code,required"`
	ConfirmationCode     string           `json:"confirmation_code" jsonschema:"title=confirmationCode,description=Booking confirmation code,required"`
	DepartureAirportCode string           `json:"departure_airport_code" jsonschema:"title=departureAirportCode,description=Departure airport IATA code,required"`
	ArrivalAirportCode   string           `json:"arrival_airport_code" jsonschema:"title=arrivalAirportCode,description=Arrival airport IATA code,required"`
	DepartureDate        string           `json:"departure_date" jsonschema:"title=departureDate,description=Departure date and time in ISO 8601 format,required,format=date-time"`
	ArrivalDate          string           `json:"arrival_date" jsonschema:"title=arrivalDate,description=Arrival date and time in ISO 8601 format,required,format=date-time"`
	Passengers           []EmailPassenger `json:"passengers" jsonschema:"title=passengers,description=List of passengers"`
	Cost                 Cost             `json:"cost" jsonschema:"title=cost,description=Total cost of the flight,required"`
	Seats                string           `json:"seats" jsonschema:"title=seats,description=Assigned seat numbers,required"`
	Link                 string           `json:"link" jsonschema:"title=link,description=Booking or confirmation link,required"`
	Airline              Airline          `json:"airline" jsonschema:"title=airline,description=Airline information,required"`
}

type EmailActivityInfo struct {
	Name             string           `json:"name" jsonschema:"title=name,description=Activity or tour name,required"`
	Description      string           `json:"description" jsonschema:"title=description,description=Activity description,required"`
	ConfirmationCode string           `json:"confirmation_code" jsonschema:"title=confirmationCode,description=Booking confirmation code,required"`
	Address          string           `json:"address" jsonschema:"title=address,description=Activity location address,required"`
	StartDate        string           `json:"start_date" jsonschema:"title=startDate,description=Activity start date and time in ISO 8601 format,required,format=date-time"`
	EndDate          string           `json:"end_date" jsonschema:"title=endDate,description=Activity end date and time in ISO 8601 format,required,format=date-time"`
	Link             string           `json:"link" jsonschema:"title=link,description=Booking or confirmation link,required"`
	Participants     []EmailPassenger `json:"participants" jsonschema:"title=participants,description=List of participants"`
	Cost             Cost             `json:"cost" jsonschema:"title=cost,description=Total cost of the activity,required"`
}

type EmailHotelInfo struct {
	Name             string           `json:"name" jsonschema:"title=name,description=Hotel or accommodation name,required"`
	Type             string           `json:"type" jsonschema:"title=type,enum=hotel,enum=home,enum=vacation_rental,enum=camp_site,description=Type of accommodation,required"`
	ConfirmationCode string           `json:"confirmation_code" jsonschema:"title=confirmationCode,description=Booking confirmation code,required"`
	Address          string           `json:"address" jsonschema:"title=address,description=Hotel address,required"`
	CheckInDate      string           `json:"check_in_date" jsonschema:"title=checkInDate,description=Check-in date and time in ISO 8601 format,required,format=date-time"`
	CheckOutDate     string           `json:"check_out_date" jsonschema:"title=checkOutDate,description=Check-out date and time in ISO 8601 format,required,format=date-time"`
	Link             string           `json:"link" jsonschema:"title=link,description=Booking or confirmation link,required"`
	Guests           []EmailPassenger `json:"guests" jsonschema:"title=guests,description=List of guests"`
	Cost             Cost             `json:"cost" jsonschema:"title=cost,description=Total cost of the accommodation,required"`
}

type EmailCarRentalInfo struct {
	ReservationID   string `json:"reservationId" jsonschema:"title=reservationId,description=Reservation ID,required"`
	RentalCompany   string `json:"rentalCompany" jsonschema:"title=rentalCompany,description=Car rental company name,required"`
	PickupLocation  string `json:"pickupLocation" jsonschema:"title=pickupLocation,description=Pickup location,required"`
	DropoffLocation string `json:"dropoffLocation" jsonschema:"title=dropoffLocation,description=Dropoff location,required"`
	PickupDateTime  string `json:"pickupDateTime" jsonschema:"title=pickupDateTime,description=Pickup date and time in ISO 8601 format,required,format=date-time"`
	DropoffDateTime string `json:"dropoffDateTime" jsonschema:"title=dropoffDateTime,description=Dropoff date and time in ISO 8601 format,required,format=date-time"`
	Cost            Cost   `json:"cost" jsonschema:"title=cost,description=Total cost of the car rental,required"`
	Link            string `json:"link" jsonschema:"title=link,description=Booking or confirmation link"`
}

type EmailParkingInfo struct {
	ConfirmationCode string `json:"confirmationCode" jsonschema:"title=confirmationCode,description=Parking reservation confirmation code,required"`
	CompanyName      string `json:"companyName" jsonschema:"title=companyName,description=Parking company name,required"`
	Address          string `json:"address" jsonschema:"title=address,description=Parking location address,required"`
	StartTime        string `json:"startTime" jsonschema:"title=startTime,description=Parking start time in ISO 8601 format,required,format=date-time"`
	EndTime          string `json:"endTime" jsonschema:"title=endTime,description=Parking end time in ISO 8601 format,required,format=date-time"`
	Cost             Cost   `json:"cost" jsonschema:"title=cost,description=Total cost of the parking,required"`
	SpotNumber       string `json:"spotNumber" jsonschema:"title=spotNumber,description=Parking spot number,required"`
	Link             string `json:"link" jsonschema:"title=link,description=Booking or confirmation link,required"`
}

type EmailTransportationInfo struct {
	TransportationType string `json:"transportationType" jsonschema:"title=transportationType,description=Type of transportation like bike, train, bus etc,required,enum=bus,enum=train,enum=car,enum=boat,enum=bike"`
	ConfirmationCode   string `json:"confirmationCode" jsonschema:"title=confirmationCode,description=Transportation reservation confirmation code,required"`
	DepartureLocation  string `json:"departureLocation" jsonschema:"title=departureLocation,description=Departure location,required"`
	ArrivalLocation    string `json:"arrivalLocation" jsonschema:"title=arrivalLocation,description=Arrival location,required"`
	StartTime          string `json:"startTime" jsonschema:"title=startTime,description=Transportation start time in ISO 8601 format,required,format=date-time"`
	EndTime            string `json:"endTime" jsonschema:"title=endTime,description=Transportation end time in ISO 8601 format,required,format=date-time"`
	Cost               Cost   `json:"cost" jsonschema:"title=cost,description=Total cost of the transportation,required"`
	Link               string `json:"link" jsonschema:"title=link,description=Booking or confirmation link,required"`
}

type EmailCategory string

func (e EmailCategory) Enum() []EmailCategory {
	return []EmailCategory{
		"flight_reservation",
		"transportation_reservation",
		"car_rental_reservation",
		"hotel_reservation",
		"unknown",
		"expense_receipt",
		"activity_reservation",
		"parking_reservation",
	}
}

func (e EmailCategory) Description() string {
	return "Classification of the types of reservations or receipts"
}

type EmailScanResult struct {
	Category        EmailCategory              `json:"category" jsonschema:"title=category,description=Classification of the types of reservations or receipts,required,enum=flight_reservation,enum=transportation_reservation,enum=car_rental_reservation,enum=hotel_reservation,enum=unknown,enum=expense_receipt,enum=activity_reservation,enum=parking_reservation"`
	Flights         []*EmailFlightInfo         `json:"flights" jsonschema:"title=flights,description=Container for flight bookings information"`
	Hotels          []*EmailHotelInfo          `json:"hotels" jsonschema:"title=hotels,description=Container for hotel bookings information"`
	Activities      []*EmailActivityInfo       `json:"activities" jsonschema:"title=activities,description=Container for activity bookings information"`
	Rentals         []*EmailCarRentalInfo      `json:"rentals" jsonschema:"title=rentals,description=Container for car rental bookings information"`
	Parkings        []*EmailParkingInfo        `json:"parkings" jsonschema:"title=parkings,description=Container for parking reservations information"`
	Transportations []*EmailTransportationInfo `json:"transportations" jsonschema:"title=transportations,description=Container for transportation bookings information"`
}
