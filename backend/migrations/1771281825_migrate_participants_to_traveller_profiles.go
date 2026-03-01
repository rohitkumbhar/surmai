package migrations

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

type participantForMigration struct {
	Name   string `json:"name"`
	Email  string `json:"email,omitempty"`
	UserId string `json:"userId,omitempty"`
}

func init() {
	m.Register(func(app core.App) error {
		travellerProfilesCollection, err := app.FindCollectionByNameOrId("traveller_profiles")
		if err != nil {
			return err
		}

		// Resolve the admin fallback owner
		var adminId string
		if adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL"); adminEmail != "" {
			if adminUser, err := app.FindAuthRecordByEmail("users", adminEmail); err == nil {
				adminId = adminUser.Id
			}
		}

		trips, err := app.FindAllRecords("trips")
		if err != nil {
			return err
		}

		for _, trip := range trips {
			var participants []participantForMigration
			if err := trip.UnmarshalJSONField("participants", &participants); err != nil || len(participants) == 0 {
				continue
			}

			// Seed the set with already-assigned travellers to avoid duplicates
			travellerSet := make(map[string]struct{})
			for _, id := range trip.GetStringSlice("travellers") {
				travellerSet[id] = struct{}{}
			}

			for _, p := range participants {
				email := p.Email
				if email == "" {
					b := make([]byte, 8)
					if _, err := rand.Read(b); err != nil {
						return fmt.Errorf("failed to generate random email: %w", err)
					}
					email = fmt.Sprintf("%s@surmai.app", hex.EncodeToString(b))
				}

				// Reuse an existing profile with this email if one exists
				if existing, err := app.FindFirstRecordByData("traveller_profiles", "email", email); err == nil {
					travellerSet[existing.Id] = struct{}{}
					continue
				}

				// Determine owner: prefer a user whose email matches, fall back to admin
				ownerId := adminId
				if userRecord, err := app.FindAuthRecordByEmail("users", email); err == nil {
					ownerId = userRecord.Id
				}

				legalName := p.Name
				if legalName == "" {
					legalName = email
				}

				profile := core.NewRecord(travellerProfilesCollection)
				profile.Set("email", email)
				profile.Set("legalName", legalName)
				if ownerId != "" {
					profile.Set("ownerId", ownerId)
				}

				if err := app.Save(profile); err != nil {
					return fmt.Errorf("failed to create traveller profile for %q: %w", email, err)
				}

				travellerSet[profile.Id] = struct{}{}
			}

			newTravellers := make([]string, 0, len(travellerSet))
			for id := range travellerSet {
				newTravellers = append(newTravellers, id)
			}

			trip.Set("travellers", newTravellers)
			if err := app.Save(trip); err != nil {
				return fmt.Errorf("failed to update travellers on trip %q: %w", trip.Id, err)
			}
		}

		return nil
	}, func(app core.App) error {
		// data-only migration; no down path
		return nil
	})
}
