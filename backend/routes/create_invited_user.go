package routes

import (
	"errors"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
)

func CreateInvitedUser(e *core.RequestEvent) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	invitationCode := info.Body["invitationCode"].(string)
	email := info.Body["email"].(string)
	name := info.Body["name"].(string)
	password := info.Body["password"].(string)

	// validate invitation code
	existingInvitation, err := e.App.FindAllRecords("account_invitations",
		dbx.NewExp("invitationCode = {:invitationCode} and recipientEmail = {:email}",
			dbx.Params{"email": email, "invitationCode": invitationCode}))
	if err != nil {
		return err
	}
	if len(existingInvitation) == 0 {
		return errors.New("invitation does not exist or has expired")
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
