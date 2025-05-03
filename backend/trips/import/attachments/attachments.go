package attachments

import (
	bt "backend/types"
	"bytes"
	"encoding/base64"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"io"
)

func UploadAttachments(app core.App, attachments []*bt.UploadedFile, tripId string) ([]string, error) {

	attachmentsCollection, _ := app.FindCollectionByNameOrId("trip_attachments")
	files, _ := GetFiles(attachments)
	attachmentReferences := make([]string, 0)

	for i, file := range files {
		if file != nil {
			fileMetadata := attachments[i]
			record := core.NewRecord(attachmentsCollection)
			record.Set("name", fileMetadata.FileName)
			record.Set("file", file)
			record.Set("trip", tripId)
			_ = app.Save(record)
			attachmentReferences = append(attachmentReferences, record.Id)
		}
	}
	return attachmentReferences, nil
}

func GetFiles(attachments []*bt.UploadedFile) ([]*filesystem.File, error) {

	files := make([]*filesystem.File, 0, len(attachments))
	for _, attachment := range attachments {
		file, _ := GetFile(attachment)
		files = append(files, file)
	}
	return files, nil
}

func GetFile(uploadedFile *bt.UploadedFile) (*filesystem.File, error) {

	fileName := uploadedFile.FileName
	encodedFileContent := uploadedFile.FileContent
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedFileContent)
	if err != nil {
		return nil, err
	}

	file, err := filesystem.NewFileFromBytes(decodedBytes, fileName)
	if err != nil {
		return nil, err
	}

	return file, nil
}

func GetAttachmentsForMigration(e core.App, r *core.Record) []*bt.UploadedFile {

	attachments := r.GetStringSlice("attachments")
	var payload []*bt.UploadedFile
	for _, attachmentName := range attachments {

		if attachmentName != "" {
			payload = append(payload, &bt.UploadedFile{
				Id:          r.Id,
				FileName:    SanitizeName(attachmentName),
				FileContent: getFileAsBase64(e, r, attachmentName),
			})
		}

	}
	return payload
}

func getFileAsBase64(e core.App, record *core.Record, fileName string) string {

	if fileName != "" {

		fileKey := record.BaseFilesPath() + "/" + fileName
		fsys, _ := e.NewFilesystem()
		defer fsys.Close()

		r, _ := fsys.GetFile(fileKey)
		defer r.Close()

		content := new(bytes.Buffer)
		_, _ = io.Copy(content, r)

		base64Str := base64.StdEncoding.EncodeToString(content.Bytes())
		return base64Str
	}

	return ""
}

func SanitizeName(fileName string) string {
	lastUnderscore := -1
	lastDot := -1
	for i := len(fileName) - 1; i >= 0; i-- {
		if fileName[i] == '.' && lastDot == -1 {
			lastDot = i
		}
		if fileName[i] == '_' {
			lastUnderscore = i
			break
		}
	}
	if lastUnderscore == -1 || lastDot == -1 {
		return fileName
	}
	return fileName[:lastUnderscore] + fileName[lastDot:]
}
