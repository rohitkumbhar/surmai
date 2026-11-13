package email_test

import (
	"backend/assistant/email"
	"backend/testutil"
	"encoding/json"
	"net"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

// setImapConfig stores an email sync configuration pointing at host:port.
func setImapConfig(t testing.TB, app *tests.TestApp, host string, port int) {
	t.Helper()

	record, err := app.FindRecordById("surmai_settings", "email_sync_config")
	if err != nil {
		t.Fatal(err)
	}
	value, err := json.Marshal(map[string]any{
		"enabled":            true,
		"imapHost":           host,
		"imapPort":           port,
		"imapUser":           "inbox@example.com",
		"imapPassword":       "secret",
		"filterEmailAddress": "bookings@example.com",
	})
	if err != nil {
		t.Fatal(err)
	}
	record.Set("value", string(value))
	if err := app.Save(record); err != nil {
		t.Fatal(err)
	}
}

// Mailbox access runs on a schedule, so a server that is unreachable or
// unconfigured has to come back as an error rather than hanging or panicking.
func TestMailboxAccessWithoutAServer(t *testing.T) {
	t.Run("nothing configured", func(t *testing.T) {
		app := testutil.NewApp(t)

		if _, err := email.CountUnreadEmails(app); err == nil {
			t.Error("expected an error when email sync is unconfigured")
		}
		if _, err := email.FetchUnreadEmails(app); err == nil {
			t.Error("expected an error when email sync is unconfigured")
		}
	})

	t.Run("nothing listening", func(t *testing.T) {
		app := testutil.NewApp(t)

		// take a port and release it, so the address is closed
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		port := listener.Addr().(*net.TCPAddr).Port
		if err := listener.Close(); err != nil {
			t.Fatal(err)
		}
		setImapConfig(t, app, "127.0.0.1", port)

		if _, err := email.CountUnreadEmails(app); err == nil {
			t.Error("expected an error when the IMAP server is unreachable")
		}
		if _, err := email.FetchUnreadEmails(app); err == nil {
			t.Error("expected an error when the IMAP server is unreachable")
		}
	})

	t.Run("the server is not speaking IMAP", func(t *testing.T) {
		app := testutil.NewApp(t)

		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = listener.Close() })
		go func() {
			for {
				conn, err := listener.Accept()
				if err != nil {
					return
				}
				_, _ = conn.Write([]byte("nonsense\r\n"))
				_ = conn.Close()
			}
		}()

		setImapConfig(t, app, "127.0.0.1", listener.Addr().(*net.TCPAddr).Port)

		if _, err := email.CountUnreadEmails(app); err == nil {
			t.Error("expected an error when the greeting is not IMAP")
		}
	})
}
