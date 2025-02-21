package migrations

import (
	"backend/datasets"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// add up queries...

		records, err := app.FindAllRecords("places")
		if err != nil {
			panic(err)
		}

		for _, place := range records {
			name := place.GetString("name")
			place.Set("asciiName", datasets.AsciiName(name))
			err = app.Save(place)
		}

		return nil
	}, func(app core.App) error {
		// add down queries...

		return nil
	})
}
