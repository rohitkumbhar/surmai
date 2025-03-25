package routes

import (
	"bytes"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
	"github.com/pocketbase/pocketbase/tools/security"
	"html/template"
	"net/http"
	"net/mail"
)

const AccountInvitationEmail = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org=/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        body, html {
            padding: 0;
            margin: 0;
            border: 0;
            color: #16161a;
            background: #fff;
            font-size: 14px;
            line-height: 20px;
            font-weight: normal;
            font-family: Source Sans Pro, sans-serif, emoji;
        }
        body {
            padding: 20px 30px;
        }
        strong {
            font-weight: bold;
        }
        em, i {
            font-style: italic;
        }
        p {
            display: block;
            margin: 10px 0;
            font-family: inherit;
        }
        small {
            font-size: 12px;
            line-height: 16px;
        }
        hr {
            display: block;
            height: 1px;
            border: 0;
            width: 100%;
            background: #e1e6ea;
            margin: 10px 0;
        }
        a {
            color: inherit;
        }
        .hidden {
            display: none !important;
        }
        .btn {
            display: inline-block;
            vertical-align: top;
            border: 0;
            cursor: pointer;
            color: #fff !important;
            background: #16161a !important;
            text-decoration: none !important;
            line-height: 40px;
            width: auto;
            min-width: 150px;
            text-align: center;
            padding: 0 20px;
            margin: 5px 0;
            font-family: Source Sans Pro, sans-serif, emoji;;
            font-size: 14px;
            font-weight: bold;
            border-radius: 6px;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
<p>Hello,</p>
<p>{{ .senderName }} been invited to create an account on Surmai"</p>
<p>Invitation Message:</p>
<p style="border:1px solid #ccc; padding: 5px 5px 5px 5px"> {{ .invitationMessage }}</p>
<p>Create an account using this <a href="{{ .applicationUrl }}/register?code={{ .invitationCode }}" target="_blank">sign up link</a></p>
<p>This invitation will expire in 1 week.</p>
<p></p>
<p>
  Thanks,<br/>
  Surmai team
</p>
</body>
</html>
`

func CreateAccountInvitation(e *core.RequestEvent) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	fromId := info.Auth.Id
	recipientEmail := info.Body["email"].(string)
	message := info.Body["message"].(string)

	existingInvitations, err := e.App.FindAllRecords("account_invitations",
		dbx.NewExp("fromId = {:fromId} and recipientEmail = {:recipientEmail}",
			dbx.Params{"recipientEmail": recipientEmail, "fromId": fromId}))
	if err != nil {
		return err
	}

	if len(existingInvitations) > 0 {
		code := existingInvitations[0].GetString("invitationCode")
		data := make(map[string]string)
		data["invitationCode"] = code
		return e.JSON(http.StatusOK, data)
	}

	// create new record
	collection, err := e.App.FindCollectionByNameOrId("account_invitations")
	if err != nil {
		return err
	}

	// generate new invitation code
	invitationCode := security.RandomString(10)
	record := core.NewRecord(collection)
	record.Set("recipientEmail", recipientEmail)
	record.Set("fromId", fromId)
	record.Set("invitationCode", invitationCode)
	record.Set("message", message)
	err = e.App.Save(record)
	if err != nil {
		return err
	}

	// send email
	err = sendEmail(e, info, invitationCode, message, recipientEmail)
	if err != nil {
		return err
	}

	response := make(map[string]string)
	response["invitationCode"] = invitationCode
	return e.JSON(http.StatusOK, response)
}

func sendEmail(e *core.RequestEvent, info *core.RequestInfo, invitationCode string, message string, recipientEmail string) error {
	var emailContents bytes.Buffer
	invitationEmailTemplate := template.Must(template.New("AccountInvitationEmail").Parse(AccountInvitationEmail))
	err := invitationEmailTemplate.Execute(&emailContents, map[string]interface{}{
		"senderName":        info.Auth.GetString("name"),
		"applicationUrl":    e.App.Settings().Meta.AppURL,
		"invitationCode":    invitationCode,
		"invitationMessage": message,
	})
	if err != nil {
		return err
	}

	email := &mailer.Message{
		From: mail.Address{
			Address: e.App.Settings().Meta.SenderAddress,
			Name:    e.App.Settings().Meta.SenderName,
		},
		To:      []mail.Address{{Address: recipientEmail}},
		Subject: "[surmai] Invitation to create an account",
		HTML:    emailContents.String(),
	}
	_ = e.App.NewMailClient().Send(email)

	return nil
}
