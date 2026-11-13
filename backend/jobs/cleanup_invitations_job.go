package jobs

import (
	"github.com/pocketbase/pocketbase/core"
	"time"

	"github.com/pocketbase/pocketbase/tools/types"

	"github.com/pocketbase/dbx"
)

type CleanupInvitationsJob struct {
	App core.App
}

func (job *CleanupInvitationsJob) Execute() {
	app := job.App
	logger := app.Logger().WithGroup("CleanupInvitationsJob")

	// See CleanupExpiredContentJob: the threshold has to be a types.DateTime
	// and invitations without an expiry must be left alone.
	now := types.NowDateTime()

	// get all invitations past expiry date
	// mark them expired if still open
	expiredInvitations, err := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn != '' AND expiresOn < {:currentTime} AND status = {:status}",
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
	deletionThreshold, err := types.ParseDateTime(now.Time().Add(-7 * 24 * time.Hour))
	if err != nil {
		logger.Error("Could not build the deletion threshold", "error", err)
		return
	}
	deletionCandidates, err := app.FindAllRecords("invitations",
		dbx.NewExp("expiresOn != '' AND expiresOn < {:deletionThreshold}",
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
