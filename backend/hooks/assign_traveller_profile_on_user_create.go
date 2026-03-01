package hooks

import (
	"slices"

	"github.com/pocketbase/pocketbase/core"
)

// AssignTravellerProfileOnUserCreate checks whether a traveller profile already
// exists for the newly-created user's email address. If one is found the new
// user becomes its owner and the previous owner (if any) is added as a manager.
func AssignTravellerProfileOnUserCreate(e *core.RecordEvent) error {
	if err := e.Next(); err != nil {
		return err
	}

	email := e.Record.GetString("email")
	if email == "" {
		return nil
	}

	profile, err := e.App.FindFirstRecordByData("traveller_profiles", "email", email)
	if err != nil {
		// No matching profile – nothing to do.
		return nil
	}

	previousOwnerId := profile.GetString("ownerId")

	profile.Set("ownerId", e.Record.Id)

	if previousOwnerId != "" && previousOwnerId != e.Record.Id {
		managers := profile.GetStringSlice("managers")
		alreadyManager := slices.Contains(managers, previousOwnerId)
		if !alreadyManager {
			managers = append(managers, previousOwnerId)
			profile.Set("managers", managers)
		}
	}

	return e.App.Save(profile)
}
