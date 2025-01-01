package main

import (
	"backend/jobs"
	R "backend/routes"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"os"
)

func (surmai *SurmaiApp) bindRoutes() {

	surmai.pb.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/impersonate", R.ImpersonateAction).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/load-city-data", R.LoadPlacesDataset).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/load-airport-data", R.LoadAirportsDataset).Bind(apis.RequireSuperuserAuth())
		se.Router.POST("/export-trip", R.ExportTrip).Bind(apis.RequireAuth())
		se.Router.POST("/import-trip", R.ImportTrip).Bind(apis.RequireAuth())

		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))
		return se.Next()
	})
}

func (surmai *SurmaiApp) bindMigrations(isGoRun bool) {

	migratecmd.MustRegister(surmai.pb, surmai.pb.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

}

func (surmai *SurmaiApp) startDemoMode() {
	if surmai.DemoMode {

		password := os.Getenv("SURMAI_DEMO_PASSWORD")
		if password == "" {
			password = "vi#c8Euuf16idhbG"
		}

		job := &jobs.ImportDemoDataJob{
			Pb:           surmai.pb,
			AdminEmail:   surmai.AdminEmail,
			DemoEmail:    "demo@surmai.app",
			DemoPassword: password,
		}

		surmai.pb.Cron().MustAdd("ImportDemoDataJob", "0 * * * *", func() {
			job.Execute()
		})
	}
}
