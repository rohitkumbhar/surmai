package routes

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
)

// requiredString reads a string field from the request body.
//
// The body is whatever the client sent, so a field that is missing or of
// another type has to be reported rather than type asserted, which would
// panic inside the handler.
func requiredString(info *core.RequestInfo, field string) (string, error) {
	value, ok := info.Body[field]
	if !ok || value == nil {
		return "", fmt.Errorf("%q is required", field)
	}

	text, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("%q must be a string", field)
	}
	if text == "" {
		return "", fmt.Errorf("%q cannot be empty", field)
	}

	return text, nil
}

// optionalString reads a string field, returning "" when it is absent.
// A field of the wrong type is still reported.
func optionalString(info *core.RequestInfo, field string) (string, error) {
	value, ok := info.Body[field]
	if !ok || value == nil {
		return "", nil
	}

	text, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("%q must be a string", field)
	}

	return text, nil
}
