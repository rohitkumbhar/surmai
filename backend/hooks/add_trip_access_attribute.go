package hooks

import (
	"github.com/pocketbase/pocketbase/core"
)

func AddTripAccessAttribute(e *core.RecordEnrichEvent) error {

	if err := e.Next(); err != nil {
		return err
	}

	auth := e.RequestInfo
	canUpdate, err := e.App.CanAccessRecord(e.Record, auth, e.Record.Collection().UpdateRule)
	if err != nil {
		return err
	}

	e.Record.WithCustomData(true) // for security requires explicitly allowing it
	e.Record.Set("canUpdate", canUpdate)

	return nil
}
