package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/ringsaturn/tzf"
	"log"
	"strconv"
)

func init() {
	m.Register(func(app core.App) error {
		finder, err := tzf.NewDefaultFinder()
		if err != nil {
			panic(err)
		}

		records, err := app.FindAllRecords("airports")
		if err != nil {
			panic(err)
		}

		for _, airport := range records {
			latitude := airport.GetString("latitude")
			longitude := airport.GetString("longitude")

			if latitude != "" && longitude != "" {
				lat, _ := strconv.ParseFloat(latitude, 64)
				long, _ := strconv.ParseFloat(longitude, 64)
				timezone := finder.GetTimezoneName(long, lat)
				airport.Set("timezone", timezone)
				err = app.Save(airport)
				if err != nil {
					log.Printf("Error saving airport to %s: %s", timezone, err)
				}
			}
		}

		return nil
	}, func(app core.App) error {
		return nil
	})
}
