package types

import "github.com/pocketbase/pocketbase/tools/types"

type VersionInfo struct {
	Tag    string `json:"tag"`
	Commit string `json:"commit"`
	Dirty  bool   `json:"dirty"`
}

type UploadedFile struct {
	Id          string `json:"id"`
	FileName    string `json:"fileName"`
	FileContent string `json:"fileContent"`
}

type Attachment struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	File string `json:"file"`
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
	Id                   string          `json:"id"`
	Type                 string          `json:"type"`
	Origin               string          `json:"origin"`
	Destination          string          `json:"destination"`
	Cost                 *Cost           `json:"cost"`
	Departure            types.DateTime  `json:"departure"`
	Arrival              types.DateTime  `json:"arrival"`
	Attachments          []*UploadedFile `json:"attachments"`
	AttachmentReferences []string        `json:"attachmentReferences"`
	Metadata             map[string]any  `json:"metadata"`
}

type Lodging struct {
	Id                   string          `json:"id"`
	Type                 string          `json:"type"`
	Name                 string          `json:"name"`
	Address              string          `json:"address"`
	ConfirmationCode     string          `json:"confirmationCode"`
	Cost                 *Cost           `json:"cost"`
	StartDate            types.DateTime  `json:"startDate"`
	EndDate              types.DateTime  `json:"endDate"`
	Attachments          []*UploadedFile `json:"attachments"`
	AttachmentReferences []string        `json:"attachmentReferences"`
	Metadata             map[string]any  `json:"metadata"`
}

type Activity struct {
	Id                   string          `json:"id"`
	Name                 string          `json:"name"`
	Description          string          `json:"description"`
	Address              string          `json:"address"`
	ConfirmationCode     string          `json:"confirmationCode"`
	Cost                 *Cost           `json:"cost"`
	StartDate            types.DateTime  `json:"startDate"`
	EndDate              types.DateTime  `json:"endDate"`
	Attachments          []*UploadedFile `json:"attachments"`
	AttachmentReferences []string        `json:"attachmentReferences"`
	Metadata             map[string]any  `json:"metadata"`
}

type Expense struct {
	Id                   string         `json:"id"`
	Name                 string         `json:"name"`
	Cost                 *Cost          `json:"cost"`
	OccurredOn           types.DateTime `json:"occurredOn"`
	Notes                string         `json:"notes"`
	Category             string         `json:"category"`
	AttachmentReferences []string       `json:"attachmentReferences"`
}

type Trip struct {
	Id                 string         `json:"id"`
	Name               string         `json:"name"`
	Description        string         `json:"description"`
	StartDate          types.DateTime `json:"startDate"`
	EndDate            types.DateTime `json:"endDate"`
	Destinations       []Destination  `json:"destinations"`
	Participants       []Participant  `json:"participants"`
	CoverImage         *UploadedFile  `json:"coverImage"`
	CoverImageFileName string         `json:"coverImageFileName"`
	Notes              string         `json:"notes"`
	Budget             *Cost          `json:"budget"`
}

type ExportedTrip struct {
	Trip            *Trip             `json:"trip"`
	Transportations []*Transportation `json:"transportations"`
	Lodgings        []*Lodging        `json:"lodgings"`
	Activities      []*Activity       `json:"activities"`
	Expenses        []*Expense        `json:"expenses"`
	Attachments     []*Attachment     `json:"attachments"`
}

type Airport struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	Latitude   string `json:"latitude"`
	Longitude  string `json:"longitude"`
	Timezone   string `json:"timezone"`
	IataCode   string `json:"iataCode"`
	IsoCountry string `json:"isoCountry"`
}

type Airline struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}
