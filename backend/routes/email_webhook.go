package routes

import (
	bt "backend/types"
	"backend/webhook"
	"fmt"
	"github.com/pocketbase/pocketbase/core"
	"net/http"
	"strings"
)

func EmailWebhook(e *core.RequestEvent, surmai *bt.SurmaiApp) error {

	info, _ := e.RequestInfo()

	toAddress := info.Body["to_address"].(string)
	fromAddress := info.Body["from_address"].(string)

	if fromAddress == "" || toAddress == "" {
		return e.JSON(http.StatusBadRequest, map[string]interface{}{})
	}

	// check for the recipient email validity (in case of a shared server)
	// remove plus address suffix
	toAddressToCheck := getActualAddress(toAddress)

	if strings.ToLower(toAddressToCheck) != strings.ToLower(surmai.WebhookSettings.ImapUsername) {
		return e.JSON(http.StatusOK, map[string]interface{}{})
	}

	// check for sender email validity (for an existing user in the system)
	_, cannotFindSiteUser := e.App.FindAuthRecordByEmail("users", strings.ToLower(fromAddress))
	if cannotFindSiteUser != nil {
		return cannotFindSiteUser
	}

	go webhook.ProcessEmailEvent(e.App, surmai, bt.EmailEvent{
		Uid:             info.Body["uid"].(float64),
		ToAddress:       info.Body["to_address"].(string),
		FromAddress:     info.Body["from_address"].(string),
		Subject:         info.Body["subject"].(string),
		FromDisplayName: info.Body["from_display_name"].(string),
		Mailbox:         info.Body["mailbox"].(string),
	})

	return e.JSON(http.StatusOK, map[string]interface{}{})
}

func getActualAddress(toAddress string) string {
	addressSplit := strings.Split(toAddress, "@")
	nameAndSuffix := strings.Split(addressSplit[0], "+")
	toAddressToCheck := fmt.Sprintf("%s@%s", nameAndSuffix[0], addressSplit[1])
	return toAddressToCheck
}
