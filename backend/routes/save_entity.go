package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

type saveEntityExpense struct {
	Name       string         `json:"name"`
	Cost       map[string]any `json:"cost"`
	OccurredOn string         `json:"occurredOn"`
	Category   string         `json:"category"`
}

type saveEntityRequest struct {
	EntityId             string         `json:"entityId"`
	Expense              *saveEntityExpense `json:"expense"`
	ExistingExpenseId    string         `json:"existingExpenseId"`
	ExistingAttachmentIds []string      `json:"existingAttachmentIds"`
	EntityData           map[string]any `json:"entityData"`
}

func SaveTransportation(e *core.RequestEvent) error {
	return saveEntity(e, "transportations")
}

func SaveLodging(e *core.RequestEvent) error {
	return saveEntity(e, "lodgings")
}

func SaveActivity(e *core.RequestEvent) error {
	return saveEntity(e, "activities")
}

func saveEntity(e *core.RequestEvent, collectionName string) error {
	trip := e.Get("trip").(*core.Record)
	tripId := trip.Id

	// Parse multipart form (32MB max)
	if err := e.Request.ParseMultipartForm(32 << 20); err != nil {
		return e.BadRequestError("Failed to parse form data", err)
	}

	// Parse the JSON payload
	payloadStr := e.Request.FormValue("payload")
	if payloadStr == "" {
		return e.BadRequestError("Missing payload field", nil)
	}

	var req saveEntityRequest
	if err := json.Unmarshal([]byte(payloadStr), &req); err != nil {
		return e.BadRequestError("Invalid payload JSON", err)
	}

	// Collect uploaded files
	var uploadedFiles []*filesystem.File
	if e.Request.MultipartForm != nil && e.Request.MultipartForm.File != nil {
		for _, fileHeaders := range e.Request.MultipartForm.File {
			for _, fh := range fileHeaders {
				f, err := fh.Open()
				if err != nil {
					return e.BadRequestError("Failed to read uploaded file", err)
				}
				data, err := io.ReadAll(f)
				f.Close()
				if err != nil {
					return e.BadRequestError("Failed to read uploaded file", err)
				}

				fsFile, err := filesystem.NewFileFromBytes(data, fh.Filename)
				if err != nil {
					return e.BadRequestError("Failed to process uploaded file", err)
				}
				uploadedFiles = append(uploadedFiles, fsFile)
			}
		}
	}

	var resultRecord *core.Record

	err := e.App.RunInTransaction(func(txApp core.App) error {
		attachmentsCollection, err := txApp.FindCollectionByNameOrId("trip_attachments")
		if err != nil {
			return fmt.Errorf("failed to find trip_attachments collection: %w", err)
		}

		// Step 1: Upload attachments and collect their IDs
		var newAttachmentIds []string
		for _, fsFile := range uploadedFiles {
			attachmentRecord := core.NewRecord(attachmentsCollection)
			attachmentRecord.Set("trip", tripId)
			attachmentRecord.Set("name", fsFile.OriginalName)
			attachmentRecord.Set("file", fsFile)

			if err := txApp.Save(attachmentRecord); err != nil {
				return fmt.Errorf("failed to save attachment: %w", err)
			}
			newAttachmentIds = append(newAttachmentIds, attachmentRecord.Id)
		}

		// Combine existing + new attachment IDs
		allAttachmentIds := append(req.ExistingAttachmentIds, newAttachmentIds...)

		// Step 2: Handle expense create/update/delete
		expenseId := req.ExistingExpenseId
		hasCost := req.Expense != nil && req.Expense.Cost != nil
		if hasCost {
			costVal, _ := req.Expense.Cost["value"].(float64)
			if costVal <= 0 {
				hasCost = false
			}
		}

		if hasCost {
			expensesCollection, err := txApp.FindCollectionByNameOrId("trip_expenses")
			if err != nil {
				return fmt.Errorf("failed to find trip_expenses collection: %w", err)
			}

			if expenseId != "" {
				// Update existing expense
				expenseRecord, err := txApp.FindRecordById("trip_expenses", expenseId)
				if err != nil {
					// Expense not found, create new one
					expenseRecord = core.NewRecord(expensesCollection)
					expenseRecord.Set("name", req.Expense.Name)
					expenseRecord.Set("trip", tripId)
					expenseRecord.Set("occurredOn", req.Expense.OccurredOn)
					expenseRecord.Set("category", req.Expense.Category)
				}
				expenseRecord.Set("cost", req.Expense.Cost)
				if err := txApp.Save(expenseRecord); err != nil {
					return fmt.Errorf("failed to update expense: %w", err)
				}
				expenseId = expenseRecord.Id
			} else {
				// Create new expense
				expenseRecord := core.NewRecord(expensesCollection)
				expenseRecord.Set("name", req.Expense.Name)
				expenseRecord.Set("trip", tripId)
				expenseRecord.Set("cost", req.Expense.Cost)
				expenseRecord.Set("occurredOn", req.Expense.OccurredOn)
				expenseRecord.Set("category", req.Expense.Category)
				if err := txApp.Save(expenseRecord); err != nil {
					return fmt.Errorf("failed to create expense: %w", err)
				}
				expenseId = expenseRecord.Id
			}
		} else if expenseId != "" {
			// Delete expense if cost is removed
			expenseRecord, err := txApp.FindRecordById("trip_expenses", expenseId)
			if err == nil {
				if err := txApp.Delete(expenseRecord); err != nil {
					return fmt.Errorf("failed to delete expense: %w", err)
				}
			}
			expenseId = ""
		}

		// Step 3: Create or update the entity
		entityCollection, err := txApp.FindCollectionByNameOrId(collectionName)
		if err != nil {
			return fmt.Errorf("failed to find %s collection: %w", collectionName, err)
		}

		var entityRecord *core.Record
		if req.EntityId != "" {
			entityRecord, err = txApp.FindRecordById(collectionName, req.EntityId)
			if err != nil {
				return fmt.Errorf("failed to find %s record: %w", collectionName, err)
			}
		} else {
			entityRecord = core.NewRecord(entityCollection)
		}

		// Set all entity fields from entityData
		for key, value := range req.EntityData {
			entityRecord.Set(key, value)
		}

		// Set trip, attachmentReferences, and expenseId
		entityRecord.Set("trip", tripId)
		entityRecord.Set("attachmentReferences", allAttachmentIds)
		entityRecord.Set("expenseId", expenseId)

		if err := txApp.Save(entityRecord); err != nil {
			return fmt.Errorf("failed to save %s record: %w", collectionName, err)
		}

		resultRecord = entityRecord
		return nil
	})

	if err != nil {
		return e.BadRequestError("Failed to save entity", err)
	}

	return e.JSON(http.StatusOK, resultRecord)
}
