package jobs

import (
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
)

type CleanupInvitationsJob struct {
	Pb *pocketbase.PocketBase
}

func (job *CleanupInvitationsJob) Execute() {
	app := job.Pb.App
	logger := app.Logger().WithGroup("CleanupInvitationsJob")
	now := time.Now()

	// get all invitations past expiry date
	// mark them expired if still open
	expiredInvitations, err := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn < {:currentTime} and status = {:status}",
			dbx.Params{"currentTime": now, "status": "open"}))

	if err != nil {
		logger.Error("FindAllRecords error", "error", err)
	} else {
		for _, invitation := range expiredInvitations {
			invitation.Set("status", "expired")
			if err := app.Save(invitation); err != nil {
				logger.Error("Save error", "invitationId", invitation.Id, "error", err)
			}
		}
		logger.Info("Marked invitations as expired", "count", len(expiredInvitations))
	}

	// get all non-open invitations 1 week past the expiry date
	// delete these records
	deletionThreshold := now.Add(-7 * 24 * time.Hour)
	deletionCandidates, err := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn < {:deletionThreshold}",
			dbx.Params{"deletionThreshold": deletionThreshold}))

	if err != nil {
		logger.Error("FindAllRecords error", "error", err)
	} else {
		for _, invitation := range deletionCandidates {
			if err := app.Delete(invitation); err != nil {
				logger.Error("Delete error", "invitationId", invitation.Id, "error", err)
			}
		}
		logger.Info("Deleted expired invitations", "count", len(deletionCandidates))
	}
}
