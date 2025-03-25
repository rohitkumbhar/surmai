package hooks

import (
	"errors"
	"github.com/pocketbase/pocketbase/core"
)

func UpdateTripCollaborationInvitation(e *core.RecordRequestEvent) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	record := e.Record
	recipientEmail := record.GetString("recipientEmail")
	tripId := record.GetString("trip")
	authUserEmail := info.Auth.GetString("email")

	if recipientEmail != authUserEmail {
		return errors.New("cannot update invitation")
	}

	err = e.Next()
	if err != nil {
		return err
	}

	if record.GetString("status") != "accepted" {
		return nil
	}

	return addUserAsCollaborator(e, tripId, info)

}

func addUserAsCollaborator(e *core.RecordRequestEvent, tripId string, info *core.RequestInfo) error {

	trip, err := e.App.FindRecordById("trips", tripId)
	if err != nil {
		return err
	}

	collaborators := trip.GetStringSlice("collaborators")
	updatedCollaborators := make([]string, 0)
	if collaborators != nil && len(collaborators) > 0 {
		for _, collaborator := range collaborators {
			if collaborator != info.Auth.Id {
				updatedCollaborators = append(updatedCollaborators, collaborator)
			}
		}
	}

	updatedCollaborators = append(updatedCollaborators, info.Auth.Id)
	trip.Set("collaborators", updatedCollaborators)
	err = e.App.Save(trip)
	if err != nil {
		return err
	}
	return nil
}
