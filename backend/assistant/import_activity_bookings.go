package assistant

import (
	bt "backend/types"
	"fmt"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func ProcessActivities(app core.App, msg *bt.Email, user *core.Record, activities []*bt.EmailActivityInfo) {
	for _, activity := range activities {
		startTimestamp, endTimestamp, parseErr := parseActivityTimestamps(app, activity.StartDate, activity.EndDate)
		if parseErr != nil {
			continue
		}

		trip, tripErr := findMatchingTrip(app, user, startTimestamp, endTimestamp)
		if tripErr != nil {
			app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not find matching trip: %v", tripErr))
			continue
		}

		start, _ := types.ParseDateTime(startTimestamp)
		end, _ := types.ParseDateTime(endTimestamp)

		txErr := app.RunInTransaction(func(txApp core.App) error {
			return saveActivity(txApp, msg, trip.Id, activity, start, end)
		})

		if txErr != nil {
			return
		}
	}
}

func parseActivityTimestamps(app core.App, startStr, endStr string) (time.Time, time.Time, error) {
	startTimestamp, err := time.Parse("2006-01-02T15:04:05", startStr)
	if err != nil {
		app.Logger().WithGroup("import_bookings").Error(fmt.Sprintf("Could not parse activity start date: %v", err))
		return time.Time{}, time.Time{}, err
	}

	endTimestamp := startTimestamp
	if endStr != "" {
		endTimestamp, err = time.Parse("2006-01-02T15:04:05", endStr)
		if err != nil {
			endTimestamp = startTimestamp
		}
	}

	return startTimestamp, endTimestamp, nil
}

func saveActivity(txApp core.App, msg *bt.Email, tripId string, activity *bt.EmailActivityInfo, start, end types.DateTime) error {
	expenseId := ""
	attachmentIds := saveAttachments(txApp, tripId, msg.Attachments)

	if activity.Cost.Value != 0 {
		expenseId = saveActivityExpense(txApp, tripId, activity)
	}

	metadata := buildActivityMetadata(activity)

	activitiesCollection, _ := txApp.FindCollectionByNameOrId("activities")
	entity := core.NewRecord(activitiesCollection)
	entity.Set("trip", tripId)
	entity.Set("name", activity.Name)
	entity.Set("description", "")
	entity.Set("address", activity.Address)
	entity.Set("confirmationCode", activity.ConfirmationCode)
	entity.Set("startDate", start)
	entity.Set("endDate", end)
	entity.Set("expenseId", expenseId)
	entity.Set("attachmentReferences", attachmentIds)
	entity.Set("metadata", metadata)
	entity.Set("link", activity.Link)

	return txApp.Save(entity)
}

func saveActivityExpense(txApp core.App, tripId string, activity *bt.EmailActivityInfo) string {
	costValue := map[string]interface{}{
		"value":    activity.Cost.Value,
		"currency": activity.Cost.Currency,
	}

	expensesCollection, _ := txApp.FindCollectionByNameOrId("trip_expenses")
	expensesRecord := core.NewRecord(expensesCollection)
	expensesRecord.Set("trip", tripId)
	expensesRecord.Set("category", "activity")
	expensesRecord.Set("cost", costValue)
	expensesRecord.Set("name", fmt.Sprintf("Activity: %s", activity.Name))
	expensesRecord.Set("occurredOn", types.NowDateTime())

	if err := txApp.Save(expensesRecord); err != nil {
		return ""
	}
	return expensesRecord.Id
}

func buildActivityMetadata(activity *bt.EmailActivityInfo) map[string]interface{} {
	metadata := map[string]interface{}{}

	if len(activity.Participants) > 0 {
		participants := make([]map[string]string, 0, len(activity.Participants))
		for _, p := range activity.Participants {
			participants = append(participants, map[string]string{
				"name":  p.Name,
				"email": p.Email,
			})
		}
		metadata["participants"] = participants
	}

	return metadata
}
