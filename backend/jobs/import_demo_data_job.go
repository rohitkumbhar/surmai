package jobs

import (
	_import "backend/trips/import"
	"os"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// DefaultDemoTripPath is where the image keeps the bundled demo archive.
const DefaultDemoTripPath = "/datasets/demo_trip.zip"

type ImportDemoDataJob struct {
	App          core.App
	DemoTripPath string
	AdminEmail   string
	DemoEmail    string
	DemoPassword string
}

func (job *ImportDemoDataJob) Execute() {
	job.deleteAllTrips()
	job.deleteAllTravellerProfiles()
	job.deleteAllUsersExceptAdmin()
	job.createDemoUser()
	job.importDemoTrip()
}

func (job *ImportDemoDataJob) deleteAllTravellerProfiles() {
	pbApp := job.App
	logger := pbApp.Logger()

	records, err := pbApp.FindAllRecords("traveller_profiles")
	if err != nil {
		logger.Error("ImportDemoDataJob.Execute (traveller_profiles) FindAllRecords error", "error", err)
		return
	}

	for _, profile := range records {
		logger.Debug("Deleting traveller profile", "id", profile.Id)

		err := pbApp.Delete(profile)
		if err != nil {
			logger.Error("Could not delete traveller profile", "id", profile.Id, "error", err)
		}
	}
}

func (job *ImportDemoDataJob) deleteAllTrips() {

	pbApp := job.App
	logger := pbApp.Logger()

	records, err := pbApp.FindAllRecords("trips")
	if err != nil {
		logger.Error("ImportDemoDataJob.Execute FindAllRecords error", "error", err)
		return
	}

	for _, trip := range records {
		logger.Debug("Deleting trip", "id", trip.Id)

		err := pbApp.Delete(trip)
		if err != nil {
			logger.Error("Could not delete trip", "id", trip.Id, "error", err)
		}
	}
}

func (job *ImportDemoDataJob) deleteAllUsersExceptAdmin() {
	pbApp := job.App
	logger := pbApp.Logger()
	adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
	records, err := pbApp.FindAllRecords("users",
		dbx.NewExp("email != {:adminEmail}", dbx.Params{"adminEmail": adminEmail}))

	if err != nil {
		logger.Error("ImportDemoDataJob.Execute FindAllRecords error", "error", err)
		return
	}

	for _, user := range records {
		logger.Debug("Deleting user", "id", user.Id)

		err := pbApp.Delete(user)
		if err != nil {
			logger.Error("Could not delete user", "id", user.Id, "error", err)
		}
	}
}

func (job *ImportDemoDataJob) createDemoUser() {
	pbApp := job.App
	logger := pbApp.Logger()

	collection, _ := pbApp.FindCollectionByNameOrId("users")
	record := core.NewRecord(collection)

	record.Set("name", "Demo User")
	record.Set("email", job.DemoEmail)
	record.Set("emailVisibility", true)
	record.Set("verified", true)
	record.Set("password", job.DemoPassword)
	err := pbApp.Save(record)
	if err != nil {
		logger.Error("Could not create Demo User", "error", err)
	}
}

func (job *ImportDemoDataJob) importDemoTrip() {
	pbApp := job.App
	logger := pbApp.Logger()

	demoUser, err := pbApp.FindAuthRecordByEmail("users", job.DemoEmail)
	if err != nil {
		logger.Error("Could not find the demo user", "email", job.DemoEmail, "error", err)
		return
	}

	path := job.DemoTripPath
	if path == "" {
		path = DefaultDemoTripPath
	}

	// The deferred close has to come after the error check: os.Open returns a
	// nil file on failure, and this job runs from the cron, where a panic in
	// the goroutine would take the process down.
	archive, err := os.Open(path)
	if err != nil {
		logger.Error("Could not open the demo trip archive", "path", path, "error", err)
		return
	}
	defer archive.Close()

	if _, err := _import.Import(pbApp, archive, demoUser.Id); err != nil {
		logger.Error("Could not import the demo trip", "error", err)
	}
}
