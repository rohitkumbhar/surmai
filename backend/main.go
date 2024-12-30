package main

import (
	_ "backend/migrations"
	R "backend/routes"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"log"
	"os"
	"strings"
)

func main() {

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDev:     isGoRun,
		DefaultDataDir: os.Getenv("PB_DATA_DIRECTORY"),
	})

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {

		se.Router.POST("/impersonate", R.ImpersonateAction).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/load-city-data", R.LoadPlacesDataset).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/load-airport-data", R.LoadAirportsDataset).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/export-trip", R.ExportTrip).Bind(apis.RequireAuth())
		se.Router.POST("/import-trip", R.ImportTrip).Bind(apis.RequireAuth())

		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
