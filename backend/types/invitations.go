package types

type InvitationStatus string

const (
	Open     InvitationStatus = "open"
	Accepted InvitationStatus = "accepted"
	Rejected InvitationStatus = "rejected"
	Expired  InvitationStatus = "expired"
)

func (t InvitationStatus) String() string {
	return string(t)
}
