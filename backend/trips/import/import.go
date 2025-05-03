package _import

import (
	"archive/zip"
	ji "backend/trips/import/json"
	zi "backend/trips/import/zip"
	"bytes"
	"github.com/pocketbase/pocketbase/core"
	"mime/multipart"
)

func openZipFile(fileContents []byte) (*zip.Reader, error) {

	// Create a reader from the buffer
	zipReader, err := zip.NewReader(bytes.NewReader(fileContents), int64(len(fileContents)))
	if err != nil {
		return nil, err
	}
	return zipReader, nil
}

func Import(e core.App, file multipart.File, ownerId string) (string, error) {

	// read file once only
	var buff bytes.Buffer
	_, err := buff.ReadFrom(file)
	if err != nil {
		return "", err
	}

	fileContents := buff.Bytes()
	reader, zipErr := openZipFile(fileContents)
	if zipErr != nil {
		return ji.ImportJsonFile(e, fileContents, ownerId)
	} else {
		return zi.ImportZip(e, reader, ownerId)
	}

}
