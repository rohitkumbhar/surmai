package hooks

import (
	"errors"
	"fmt"
	"slices"

	"github.com/pocketbase/pocketbase/core"
)

// RestrictManagersUpdate enforces that only the profile owner can modify
// the managers field on a traveller_profiles record.
//
// It handles two cases:
//   - "managers" in the request body: direct replacement (used for removal).
//   - "addManagerEmails" in the request body: each email is resolved to a user ID
//     on the backend and appended to the current managers list.
func RestrictManagersUpdate(e *core.RecordRequestEvent) error {
	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	_, managersInBody := info.Body["managers"]
	addManagerEmails, _ := info.Body["addManagerEmails"].([]any)

	if !managersInBody && len(addManagerEmails) == 0 {
		return e.Next()
	}

	if info.Auth == nil {
		return errors.New("unauthenticated")
	}

	// Fetch the unmodified record to get the true current ownerId.
	original, err := e.App.FindRecordById("traveller_profiles", e.Record.Id)
	if err != nil {
		return err
	}

	if original.GetString("ownerId") != info.Auth.Id {
		return errors.New("only the profile owner can modify managers")
	}

	if len(addManagerEmails) > 0 {
		managers := original.GetStringSlice("managers")
		for _, item := range addManagerEmails {
			email, ok := item.(string)
			if !ok || email == "" {
				continue
			}
			user, err := e.App.FindAuthRecordByEmail("users", email)
			if err != nil {
				return fmt.Errorf("no user found with email %q", email)
			}
			if !slices.Contains(managers, user.Id) {
				managers = append(managers, user.Id)
			}
		}
		e.Record.Set("managers", managers)
	}

	return e.Next()
}
