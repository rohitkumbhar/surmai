package app

import (
	"backend/hooks"
	"backend/jobs"
	"backend/middleware"
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

		adminRoutes := se.Router.Group("/api/surmai/settings")
		adminRoutes.Bind(apis.RequireSuperuserAuth())
		adminRoutes.POST("/invite-user", R.CreateAccountInvitation)
		adminRoutes.POST("/datasets", func(e *core.RequestEvent) error {
			return R.LoadDataset(e, surmai.TimezoneFinder)
		})

		// These routes are handled by React Router to load the appropriate component
		// It's possible that these routes are bookmarked and are loaded directly
		// in the browser. Return the index.html and let the React router take over
		se.Router.GET("/login", R.ShowIndexPage).Bind()
		se.Router.GET("/trips/{path...}", R.ShowIndexPage).Bind()
		se.Router.GET("/settings", R.ShowIndexPage).Bind()
		se.Router.GET("/profile", R.ShowIndexPage).Bind()
		se.Router.GET("/invitations", R.ShowIndexPage).Bind()

		// Create invited user
		se.Router.POST("/api/surmai/create-user", R.CreateInvitedUser).Bind()

		// Import a new trip
		se.Router.POST("/api/surmai/trip/import", R.ImportTrip).Bind(apis.RequireAuth())

		// Ops on existing trips
		tripRoutes := se.Router.Group("/api/surmai/trip/{tripId}")
		tripRoutes.Bind(apis.RequireAuth(), middleware.RequireTripAccess())
		tripRoutes.GET("/collaborators", R.GetTripCollaborators)
		tripRoutes.POST("/export", R.ExportTrip)

		// Public routes
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

	surmai.Pb.OnRecordCreateRequest("invitations").BindFunc(hooks.CreateTripCollaborationInvitation)
	surmai.Pb.OnRecordUpdateRequest("invitations").BindFunc(hooks.UpdateTripCollaborationInvitation)
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
