package app

import (
	"backend/hooks"
	"backend/jobs"
	R "backend/routes"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/ringsaturn/tzf"
	"os"
)

type SurmaiApp struct {
	Pb             *pocketbase.PocketBase
	DemoMode       bool
	AdminEmail     string
	TimezoneFinder tzf.F
}

func (surmai *SurmaiApp) BindRoutes() {

	surmai.Pb.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/impersonate", R.ImpersonateAction).Bind(apis.RequireSuperuserAuth())

		se.Router.POST("/load-airline-data", R.LoadAirlinesDataset).Bind(apis.RequireSuperuserAuth())

		se.Router.POST("/load-city-data", func(e *core.RequestEvent) error {
			return R.LoadPlacesDataset(e, surmai.TimezoneFinder)
		}).Bind(apis.RequireSuperuserAuth())

		se.Router.GET("/load-airport-data", func(e *core.RequestEvent) error {
			return R.LoadAirportsDataset(e, surmai.TimezoneFinder)
		}).Bind(apis.RequireAuth())

		se.Router.POST("/export-trip", R.ExportTrip).Bind(apis.RequireAuth())
		se.Router.POST("/import-trip", R.ImportTrip).Bind(apis.RequireAuth())
		se.Router.GET("/trip/collaborators", R.GetTripCollaborators).Bind(apis.RequireAuth())
		se.Router.GET("/get-timezone", func(e *core.RequestEvent) error {
			return R.GetTimeZone(e, surmai.TimezoneFinder)
		}).Bind(apis.RequireAuth())

		se.Router.GET("/site-settings.json", func(e *core.RequestEvent) error {
			return R.SiteSettings(e, surmai.DemoMode)
		}).Bind()

		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))
		return se.Next()
	})
}

func (surmai *SurmaiApp) BindMigrations(isGoRun bool) {

	migratecmd.MustRegister(surmai.Pb, surmai.Pb.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

}

func (surmai *SurmaiApp) BuildTimezoneFinder() {

	finder, err := tzf.NewDefaultFinder()
	if err != nil {
		panic(err)
	}
	surmai.TimezoneFinder = finder

}

func (surmai *SurmaiApp) BindEventHooks() {
	surmai.Pb.OnRecordCreate("trips").BindFunc(func(e *core.RecordEvent) error {
		return hooks.AddTimezoneToDestinations(e, surmai.TimezoneFinder)
	})

	surmai.Pb.OnRecordUpdate("trips").BindFunc(func(e *core.RecordEvent) error {
		return hooks.AddTimezoneToDestinations(e, surmai.TimezoneFinder)
	})

	surmai.Pb.OnRecordCreateRequest("invitations").BindFunc(hooks.CreateInvitationEventHook)
	surmai.Pb.OnRecordUpdateRequest("invitations").BindFunc(hooks.UpdateInvitationEventHook)
}

func (surmai *SurmaiApp) StartJobs() {
	surmai.startInvitationCleanupJob()
	surmai.startDemoModeSetupJob()
}

func (surmai *SurmaiApp) startInvitationCleanupJob() {

	job := &jobs.CleanupInvitationsJob{
		Pb: surmai.Pb,
	}

	surmai.Pb.Cron().MustAdd("CleanupInvitationsJob", "0 * * * *", func() {
		job.Execute()
	})
}

func (surmai *SurmaiApp) startDemoModeSetupJob() {
	if surmai.DemoMode {

		password := os.Getenv("SURMAI_DEMO_PASSWORD")
		if password == "" {
			password = "vi#c8Euuf16idhbG"
		}

		job := &jobs.ImportDemoDataJob{
			Pb:           surmai.Pb,
			AdminEmail:   surmai.AdminEmail,
			DemoEmail:    "demo@surmai.app",
			DemoPassword: password,
		}

		surmai.Pb.Cron().MustAdd("ImportDemoDataJob", "0 * * * *", func() {
			job.Execute()
		})
	}
}
