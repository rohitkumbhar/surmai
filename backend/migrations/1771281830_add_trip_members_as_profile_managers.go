package migrations

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		trips, err := app.FindAllRecords("trips")
		if err != nil {
			return err
		}

		for _, trip := range trips {
			travellerIds := trip.GetStringSlice("travellers")
			if len(travellerIds) == 0 {
				continue
			}

			// Collect users to add as managers: trip owner + collaborators
			newManagers := make(map[string]struct{})
			if ownerId := trip.GetString("ownerId"); ownerId != "" {
				newManagers[ownerId] = struct{}{}
			}
			for _, collabId := range trip.GetStringSlice("collaborators") {
				if collabId != "" {
					newManagers[collabId] = struct{}{}
				}
			}

			if len(newManagers) == 0 {
				continue
			}

			for _, profileId := range travellerIds {
				profile, err := app.FindRecordById("traveller_profiles", profileId)
				if err != nil {
					// Profile may have been deleted; skip silently
					continue
				}

				profileOwnerId := profile.GetString("ownerId")

				// Merge existing managers with new ones, skipping the profile owner
				managersSet := make(map[string]struct{})
				for _, id := range profile.GetStringSlice("managers") {
					managersSet[id] = struct{}{}
				}
				for id := range newManagers {
					if id != profileOwnerId {
						managersSet[id] = struct{}{}
					}
				}

				merged := make([]string, 0, len(managersSet))
				for id := range managersSet {
					merged = append(merged, id)
				}

				profile.Set("managers", merged)
				if err := app.Save(profile); err != nil {
					return fmt.Errorf("failed to update managers for profile %q: %w", profile.Id, err)
				}
			}
		}

		return nil
	}, func(app core.App) error {
		// data-only migration; no down path
		return nil
	})
}
