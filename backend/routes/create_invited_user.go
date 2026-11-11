package routes

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func CreateInvitedUser(e *core.RequestEvent) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	invitationCode, err := requiredString(info, "invitationCode")
	if err != nil {
		return e.BadRequestError("Invalid request", err)
	}
	email, err := requiredString(info, "email")
	if err != nil {
		return e.BadRequestError("Invalid request", err)
	}
	password, err := requiredString(info, "password")
	if err != nil {
		return e.BadRequestError("Invalid request", err)
	}
	name, err := optionalString(info, "name")
	if err != nil {
		return e.BadRequestError("Invalid request", err)
	}

	// validate invitation code
	existingInvitation, err := e.App.FindAllRecords("account_invitations",
		dbx.NewExp("invitationCode = {:invitationCode} and recipientEmail = {:email}",
			dbx.Params{"email": email, "invitationCode": invitationCode}))
	if err != nil {
		return err
	}
	if len(existingInvitation) == 0 {
		return e.BadRequestError("Invitation does not exist or has expired", nil)
	}

	usersCollection, err := e.App.FindCollectionByNameOrId("users")
	if err != nil {
		return err
	}

	err = e.App.RunInTransaction(func(txApp core.App) error {

		// create new record
		record := core.NewRecord(usersCollection)
		record.Set("email", email)
		record.Set("name", name)
		record.Set("password", password)
		record.Set("emailVisibility", true)
		if txErr := txApp.Save(record); txErr != nil {
			return txErr
		}

		// delete invitation
		for _, invitation := range existingInvitation {
			txErr := txApp.Delete(invitation)
			if txErr != nil {
				return txErr
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	user, err := e.App.FindAuthRecordByEmail("users", email)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, user)
}
