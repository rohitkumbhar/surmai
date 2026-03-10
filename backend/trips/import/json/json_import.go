package json

import (
	"errors"
	"github.com/pocketbase/pocketbase/core"
)

func ImportJsonFile(e core.App, fileContents []byte, ownerId string) (string, error) {
	return "", errors.New("JSON export import is an unsupported mechanism now")
}
