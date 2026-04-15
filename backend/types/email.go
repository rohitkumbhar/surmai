package types

import "time"

type EmailSyncConfig struct {
	Enabled      bool   `json:"enabled"`
	ImapHost     string `json:"imapHost"`
	ImapPort     int    `json:"imapPort"`
	ImapUser     string `json:"imapUser"`
	ImapPassword string `json:"imapPassword"`
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
