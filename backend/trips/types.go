package trips

import "github.com/pocketbase/pocketbase/tools/types"

type UploadedFile struct {
	FileName    string `json:"fileName"`
	FileContent string `json:"fileContent"`
}

type Destination struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	StateName   string `json:"stateName"`
	CountryName string `json:"countryName"`
	TimeZone    string `json:"timezone"`
	Latitude    string `json:"latitude"`
	Longitude   string `json:"longitude"`
}

type Participant struct {
	Name string `json:"name"`
}

type Cost struct {
	Value    float64 `json:"value"`
	Currency string  `json:"currency"`
}

type Transportation struct {
	Id          string          `json:"id"`
	Type        string          `json:"type"`
	Origin      string          `json:"origin"`
	Destination string          `json:"destination"`
	Cost        *Cost           `json:"cost"`
	Departure   types.DateTime  `json:"departure"`
	Arrival     types.DateTime  `json:"arrival"`
	Attachments []*UploadedFile `json:"attachments"`
	Metadata    *map[string]any `json:"metadata"`
}

type Lodging struct {
	Id               string          `json:"id"`
	Type             string          `json:"type"`
	Name             string          `json:"name"`
	Address          string          `json:"address"`
	ConfirmationCode string          `json:"confirmationCode"`
	Cost             *Cost           `json:"cost"`
	StartDate        types.DateTime  `json:"startDate"`
	EndDate          types.DateTime  `json:"endDate"`
	Attachments      []*UploadedFile `json:"attachments"`
	Metadata         *map[string]any `json:"metadata"`
}

type Activity struct {
	Id               string          `json:"id"`
	Name             string          `json:"name"`
	Description      string          `json:"description"`
	Address          string          `json:"address"`
	ConfirmationCode string          `json:"confirmationCode"`
	Cost             *Cost           `json:"cost"`
	StartDate        types.DateTime  `json:"startDate"`
	Attachments      []*UploadedFile `json:"attachments"`
	Metadata         *map[string]any `json:"metadata"`
}

type Trip struct {
	Id           string         `json:"id"`
	Name         string         `json:"name"`
	Description  string         `json:"description"`
	StartDate    types.DateTime `json:"startDate"`
	EndDate      types.DateTime `json:"endDate"`
	Destinations []Destination  `json:"destinations"`
	Participants []Participant  `json:"participants"`
	CoverImage   *UploadedFile  `json:"coverImage"`
}

type ExportedTrip struct {
	Trip            *Trip             `json:"trip"`
	Transportations []*Transportation `json:"transportations"`
	Lodgings        []*Lodging        `json:"lodgings"`
	Activities      []*Activity       `json:"activities"`
}
