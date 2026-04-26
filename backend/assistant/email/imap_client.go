package email

import (
	"backend/settings"
	bt "backend/types"
	"errors"
	"fmt"
	"io"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/mail"
	"github.com/pocketbase/pocketbase/core"
)

func connectToInbox(app core.App) (*client.Client, error, func(c *client.Client)) {

	config, err := settings.FetchEmailSyncConfig(app)

	if err != nil {
		return nil, err, nil
	}

	if !config.Enabled {
		return nil, errors.New("email sync is not enabled"), nil
	}

	imapClient, err := client.DialTLS(fmt.Sprintf("%s:%d", config.ImapHost, config.ImapPort), nil)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not connect to IMAP server: %v", err))
		return nil, err, nil
	}

	closeConnection := func(c *client.Client) {
		logoutError := c.Logout()
		if logoutError != nil {
			app.Logger().Warn("Failed to logout from the IMAP server: %v", logoutError)
		}
	}

	// Login
	if err = imapClient.Login(config.ImapUser, config.ImapPassword); err != nil {
		app.Logger().Error(fmt.Sprintf("Could not login to IMAP server: %v", err))
		return nil, err, nil
	}

	_, err = imapClient.Select("INBOX", false)
	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not select INBOX folder: %v", err))
		return nil, err, nil
	}

	return imapClient, nil, closeConnection
}

func CountUnreadEmails(app core.App) (int, error) {

	imapClient, err, closeConnection := connectToInbox(app)
	if err != nil {
		return -1, err
	}

	defer closeConnection(imapClient)

	criteria := imap.NewSearchCriteria()
	criteria.WithoutFlags = []string{imap.SeenFlag}

	uids, err := imapClient.Search(criteria)

	if err != nil {
		app.Logger().Error(fmt.Sprintf("Could not search for unread emails: %v", err))
		return -1, err
	}

	return len(uids), nil
}

func FetchUnreadEmails(app core.App) ([]bt.Email, error) {

	config, err := settings.FetchEmailSyncConfig(app)
	if err != nil {
		return nil, err
	}

	c, err, closeConnection := connectToInbox(app)
	if err != nil {
		return nil, err
	}

	defer closeConnection(c)

	criteria := imap.NewSearchCriteria()
	criteria.WithoutFlags = []string{imap.SeenFlag}

	uids, err := c.UidSearch(criteria)
	if err != nil {
		return nil, err
	}
	if len(uids) == 0 {
		return []bt.Email{}, nil
	}

	// 3. Prepare fetch
	seqset := new(imap.SeqSet)
	seqset.AddNum(uids...)

	section := &imap.BodySectionName{
		Peek: true,
	}

	items := []imap.FetchItem{
		imap.FetchEnvelope,
		section.FetchItem(),
	}

	messages := make(chan *imap.Message, 10)
	errCh := make(chan error, 1)

	// 4. Fetch in goroutine
	go func() {
		errCh <- c.UidFetch(seqset, items, messages)
	}()

	var results []bt.Email

	// 5. Process messages
	for msg := range messages {

		if msg == nil || msg.Envelope == nil {
			continue
		}

		if config.FilterEmailAddress != "" {

			foundInTo := checkRecipientEmailMatch(msg.Envelope.To, config)
			foundInCC := checkRecipientEmailMatch(msg.Envelope.Cc, config)
			foundInBCC := checkRecipientEmailMatch(msg.Envelope.Bcc, config)

			if !(foundInTo || foundInCC || foundInBCC) {
				continue
			}
		}

		email := bt.Email{
			Uid:       msg.Uid,
			MessageId: msg.Envelope.MessageId,
			Subject:   msg.Envelope.Subject,
			Date:      msg.Envelope.Date,
		}

		// From
		if len(msg.Envelope.From) > 0 {
			addr := msg.Envelope.From[0]
			email.From = addr.MailboxName + "@" + addr.HostName
		}

		body := msg.GetBody(section)
		if body == nil {
			continue
		}

		messageReader, mrErr := mail.CreateReader(body)
		if mrErr != nil {
			app.Logger().Error(fmt.Sprintf("Could not create message reader for %s : %v ", msg.Envelope.Subject, mrErr))
			continue
		}

		// Walk parts
		for {
			part, partErr := messageReader.NextPart()
			if partErr == io.EOF {
				break
			}
			if partErr != nil {
				app.Logger().Error(fmt.Sprintf("Could not message part for %s : %v ", msg.Envelope.Subject, partErr))
				break
			}

			switch h := part.Header.(type) {

			case *mail.InlineHeader:
				contentType, _, _ := h.ContentType()
				b, _ := io.ReadAll(part.Body)

				switch contentType {
				case "text/plain":
					email.TextBody = string(b)
				case "text/html":
					email.HTMLBody = string(b)
				}

			case *mail.AttachmentHeader:
				filename, _ := h.Filename()
				contentType, _, _ := h.ContentType()
				b, _ := io.ReadAll(part.Body)

				email.Attachments = append(email.Attachments, bt.EmailAttachment{
					Name:     filename,
					FileType: contentType,
					Content:  b,
				})
			}
		}

		results = append(results, email)
	}

	// 6. Check fetch error
	if err := <-errCh; err != nil {
		return nil, err
	}

	return results, nil
}

func checkRecipientEmailMatch(addresses []*imap.Address, config *bt.EmailSyncConfig) bool {

	var found = false
	for _, recipient := range addresses {
		if recipient.Address() == config.FilterEmailAddress {
			found = true
			break
		}
	}
	return found
}
