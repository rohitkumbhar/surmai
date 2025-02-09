package jobs

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"time"
)

type CleanupInvitationsJob struct {
	Pb *pocketbase.PocketBase
}

func (job *CleanupInvitationsJob) Execute() {

	// get all invitations past expiry date
	// mark them expired if still open
	app := job.Pb.App
	expiredInvitations, _ := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn < {:currentTime} and status = {:status} ",
			dbx.Params{"currentTime": time.Now(), "status": "open"}))

	for _, invitation := range expiredInvitations {
		invitation.Set("status", "expired")
		_ = app.Save(invitation)
	}

	// get all non-open invitations 1 week past the expiry date
	// delete these records
	deletionCandidates, _ := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn < {:deletionThreshold}",
			dbx.Params{"deletionThreshold": time.Now().Add(-7 * 24 * time.Hour)}))

	for _, invitation := range deletionCandidates {
		_ = app.Delete(invitation)
	}

}
