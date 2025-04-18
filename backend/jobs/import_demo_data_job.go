package jobs

import (
	"backend/trips/import"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"log/slog"
	"os"
)

type ImportDemoDataJob struct {
	Pb           *pocketbase.PocketBase
	AdminEmail   string
	DemoEmail    string
	DemoPassword string
}

func (job *ImportDemoDataJob) Execute() {
	slog.Info("Importing Demo Data")
	job.deleteAllTrips()
	job.deleteAllUsersExceptAdmin()
	job.createDemoUser()
	job.importDemoTrip()
}

func (job *ImportDemoDataJob) deleteAllTrips() {

	pbApp := job.Pb.App
	logger := pbApp.Logger()

	// Transportations, Lodgings and Activities are set to cascade delete
	records, err := pbApp.FindAllRecords("trips")
	if err != nil {
		logger.Error("ImportDemoDataJob.Execute FindAllRecords error:%v", err)
		return
	}

	for _, trip := range records {
		logger.Debug("Deleting trip with id: %s", trip.Id)

		err := pbApp.Delete(trip)
		if err != nil {
			logger.Error("Could not delete trip with id: %s => %v", trip.Id, err)
		}
	}
}

func (job *ImportDemoDataJob) deleteAllUsersExceptAdmin() {
	pbApp := job.Pb.App
	logger := pbApp.Logger()
	adminEmail := os.Getenv("SURMAI_ADMIN_EMAIL")
	records, err := pbApp.FindAllRecords("users",
		dbx.NewExp("email != {:adminEmail}", dbx.Params{"adminEmail": adminEmail}))

	if err != nil {
		logger.Error("ImportDemoDataJob.Execute FindAllRecords error:%v", err)
		return
	}

	for _, user := range records {
		logger.Debug("Deleting user with id: %s", user.Id)

		err := pbApp.Delete(user)
		if err != nil {
			logger.Error("Could not delete User with id: %s => %v", user.Id, err)
		}
	}
}

func (job *ImportDemoDataJob) createDemoUser() {
	pbApp := job.Pb.App
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
		logger.Error("Could not create Demo User: %v", err)
	}
}

func (job *ImportDemoDataJob) importDemoTrip() {
	pbApp := job.Pb.App
	demoUser, noDemoUserError := pbApp.FindAuthRecordByEmail("users", job.DemoEmail)

	open, err := os.Open("/datasets/demo_trip.json")
	defer open.Close()
	if err == nil && noDemoUserError == nil {
		_, _ = _import.Import(pbApp, open, demoUser.Id)
	}
}
