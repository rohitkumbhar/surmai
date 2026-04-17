package routes

import (
	imap "backend/assistant/email"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

func TestImapConnectivity(e *core.RequestEvent) error {

	app := e.App

	count, err := imap.CountUnreadEmails(app)
	if err != nil {
		return err
	}

	return e.JSON(http.StatusOK, map[string]int{"unreadEmailCount": count})
}
