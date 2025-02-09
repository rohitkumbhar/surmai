package hooks

import (
	bt "backend/types"
	"bytes"
	"errors"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
	"html/template"
	"net/mail"
	"time"
)

const InvitationEmail = `
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
<p>{{ .senderName }} has invited you to collaborate on "{{ .tripName }}"</p>
<p>Invitation Message:</p>
<p style="border:1px solid #ccc; padding: 5px 5px 5px 5px"> {{ .invitationMessage }}</p>
<a class="btn" href="{{ .applicationUrl }}/invitations" target="_blank">View Invitation</a>
<p>This invitation will expire in 1 week.</p>
<p><i>If you do not have an account, you will have to create with this email address.</i></p>
<p></p>
<p>
  Thanks,<br/>
  Surmai team
</p>
</body>
</html>
`

func CreateInvitationEventHook(e *core.RecordRequestEvent) error {

	info, err := e.RequestInfo()
	if err != nil {
		return err
	}

	record := e.Record
	tripId := record.GetString("trip")
	recipientEmail := record.GetString("recipientEmail")

	trip, err := e.App.FindRecordById("trips", tripId)
	if err != nil {
		return err
	}

	// user can edit the trip
	accessRecord, err := e.App.CanAccessRecord(trip, info, trip.Collection().UpdateRule)
	if err != nil {
		return err
	}

	if !accessRecord {
		return errors.New("user cannot access this record")
	}

	// Verify open invitations for the trip
	existingInvitations, err := e.App.FindAllRecords("invitations",
		dbx.NewExp("trip = {:tripId} and recipientEmail = {:email} and status = {:status}",
			dbx.Params{"email": recipientEmail, "tripId": tripId, "status": "open"}))
	if err != nil {
		return err
	}

	if len(existingInvitations) > 0 {
		// don't add another invitation
		return nil
	}

	senderId, metadata, err2 := buildMetadata(e, info, trip)
	if err2 != nil {
		return err2
	}

	record.Set("metadata", metadata)
	record.Set("from", senderId)
	record.Set("expiresOn", time.Now().Add(24*7*time.Hour))
	record.Set("status", bt.Open.String())

	err = e.Next()

	if err != nil {
		return err
	}

	// send email

	var emailContents bytes.Buffer

	invitationEmailTemplate := template.Must(template.New("InvitationEmail").Parse(InvitationEmail))
	err = invitationEmailTemplate.Execute(&emailContents, map[string]interface{}{
		"senderName":        info.Auth.GetString("name"),
		"applicationUrl":    e.App.Settings().Meta.AppURL,
		"tripId":            tripId,
		"tripName":          trip.GetString("name"),
		"invitationMessage": record.GetString("message"),
	})
	if err != nil {
		return err
	}

	message := &mailer.Message{
		From: mail.Address{
			Address: e.App.Settings().Meta.SenderAddress,
			Name:    e.App.Settings().Meta.SenderName,
		},
		To:      []mail.Address{{Address: recipientEmail}},
		Subject: "[surmai] Invitation to collaborate",
		HTML:    emailContents.String(),
	}

	return e.App.NewMailClient().Send(message)
}

func buildMetadata(e *core.RecordRequestEvent, info *core.RequestInfo, trip *core.Record) (string, map[string]interface{}, error) {
	senderId := info.Auth.Id
	sender, err := e.App.FindRecordById("users", senderId)
	if err != nil {
		return "", nil, err
	}

	metadata := make(map[string]interface{})
	senderMetadata := make(map[string]string)
	tripMetadata := make(map[string]interface{})

	tripMetadata["name"] = trip.GetString("name")
	tripMetadata["description"] = trip.GetString("description")
	tripMetadata["startDate"] = trip.GetDateTime("startDate")
	tripMetadata["endDate"] = trip.GetDateTime("endDate")
	metadata["trip"] = tripMetadata

	senderMetadata["name"] = sender.GetString("name")
	metadata["sender"] = senderMetadata
	return senderId, metadata, nil
}
