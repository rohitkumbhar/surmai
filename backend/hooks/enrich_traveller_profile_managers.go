package hooks

import "github.com/pocketbase/pocketbase/core"

// EnrichTravellerProfileManagers replaces the raw manager IDs in the
// "managers" field with lightweight objects containing the user's id,
// email, and name so callers do not need a separate expand parameter.
func EnrichTravellerProfileManagers(e *core.RecordEnrichEvent) error {
	if err := e.Next(); err != nil {
		return err
	}

	managerIds := e.Record.GetStringSlice("managers")
	if len(managerIds) == 0 {
		return nil
	}

	enriched := make([]map[string]any, 0, len(managerIds))
	for _, id := range managerIds {
		user, err := e.App.FindRecordById("users", id)
		if err != nil {
			// Skip managers that no longer exist rather than failing the request.
			continue
		}
		enriched = append(enriched, map[string]any{
			"id":    user.Id,
			"email": user.GetString("email"),
			"name":  user.GetString("name"),
		})
	}

	expandedRecord := make(map[string]any)
	expandedRecord["managers"] = enriched

	e.Record.Set("expand", expandedRecord)
	return nil
}
