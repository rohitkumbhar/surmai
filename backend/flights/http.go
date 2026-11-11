package flights

import (
	"net/http"
	"time"
)

// DefaultTimeout bounds calls to a flight data provider, so a provider that
// stops responding cannot hold a request open indefinitely.
const DefaultTimeout = 15 * time.Second

var defaultClient = &http.Client{Timeout: DefaultTimeout}

// Client returns the given client, or a shared one with a timeout.
// Providers accept a client so tests can point them at a local server.
func Client(client *http.Client) *http.Client {
	if client != nil {
		return client
	}
	return defaultClient
}

// BaseURL returns the configured address, or fallback when it is empty.
func BaseURL(configured, fallback string) string {
	if configured != "" {
		return configured
	}
	return fallback
}
