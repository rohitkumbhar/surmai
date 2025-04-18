package app

import (
	"backend/hooks"
	"backend/jobs"
	"backend/middleware"
	R "backend/routes"
	bt "backend/types"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/ringsaturn/tzf"
	"log/slog"
	"os"
)

func InitializeSurmai(isGoRun bool) *bt.SurmaiApp {

	surmai := &bt.SurmaiApp{
		Pb: pocketbase.NewWithConfig(pocketbase.Config{
			DefaultDev:     isGoRun,
			DefaultDataDir: os.Getenv("PB_DATA_DIRECTORY"),
		}),
		DemoMode: &bt.DemoMode{
			Enabled:      os.Getenv("SURMAI_DEMO_MODE") == "true",
			DemoEmail:    os.Getenv("SURMAI_DEMO_EMAIL"),
			DemoPassword: os.Getenv("SURMAI_DEMO_PASSWORD"),
		},
		AdminEmail: os.Getenv("SURMAI_ADMIN_EMAIL"),
		WebhookSettings: &bt.EmailWebhookSettings{
			Enabled:       os.Getenv("SURMAI_WEBHOOK_ENABLED") == "true",
			WebhookSecret: os.Getenv("SURMAI_WEBHOOK_SECRET"),
			ImapServer:    os.Getenv("SURMAI_WEBHOOK_IMAP_SERVER"),
			ImapUsername:  os.Getenv("SURMAI_WEBHOOK_IMAP_USERNAME"),
			ImapPassword:  os.Getenv("SURMAI_WEBHOOK_IMAP_PASSWORD"),
		},
		LlmSettings: &bt.LlmSettings{
			Type:            os.Getenv("SURMAI_LLM_TYPE"), // ollama or openai
			ModelName:       os.Getenv("SURMAI_LLM_MODEL"),
			OllamaServerUrl: os.Getenv("SURMAI_OLLAMA_URL"), // used by
			OpenAIApiKey:    os.Getenv("SURMAI_OPENAI_API_KEY"),
		},
	}

	bindRoutes(surmai)
	bindMigrations(isGoRun, surmai)
	buildTimezoneFinder(surmai)
	bindEventHooks(surmai)
	startJobs(surmai)

	return surmai
}

func bindRoutes(surmai *bt.SurmaiApp) {

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
		se.Router.GET("/register", R.ShowIndexPage).Bind()

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

		// Email webhook endpoint
		se.Router.POST("/api/surmai/webhook", func(e *core.RequestEvent) error {
			return R.EmailWebhook(e, surmai)
		}).Bind(middleware.RequireSurmaiSecret(surmai.WebhookSettings))

		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))
		return se.Next()
	})
}

func bindMigrations(isGoRun bool, surmai *bt.SurmaiApp) {

	migratecmd.MustRegister(surmai.Pb, surmai.Pb.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

}

func buildTimezoneFinder(surmai *bt.SurmaiApp) {

	finder, err := tzf.NewDefaultFinder()
	if err != nil {
		panic(err)
	}
	surmai.TimezoneFinder = finder

}

func bindEventHooks(surmai *bt.SurmaiApp) {
	surmai.Pb.OnRecordCreate("trips").BindFunc(func(e *core.RecordEvent) error {
		return hooks.AddTimezoneToDestinations(e, surmai.TimezoneFinder)
	})

	surmai.Pb.OnRecordUpdate("trips").BindFunc(func(e *core.RecordEvent) error {
		return hooks.AddTimezoneToDestinations(e, surmai.TimezoneFinder)
	})

	surmai.Pb.OnRecordCreateRequest("invitations").BindFunc(hooks.CreateTripCollaborationInvitation)
	surmai.Pb.OnRecordUpdateRequest("invitations").BindFunc(hooks.UpdateTripCollaborationInvitation)
}

func startJobs(surmai *bt.SurmaiApp) {
	startInvitationCleanupJob(surmai)
	startDemoModeSetupJob(surmai)
}

func startInvitationCleanupJob(surmai *bt.SurmaiApp) {

	job := &jobs.CleanupInvitationsJob{
		Pb: surmai.Pb,
	}

	surmai.Pb.Cron().MustAdd("CleanupInvitationsJob", "0 * * * *", func() {
		job.Execute()
	})
}

func startDemoModeSetupJob(surmai *bt.SurmaiApp) {
	if surmai.DemoMode.Enabled {

		password := surmai.DemoMode.DemoPassword
		if password == "" {
			password = "vi#c8Euuf16idhbG"
		}

		demoEmail := surmai.DemoMode.DemoEmail
		if demoEmail == "" {
			demoEmail = "demo@surmai.app"
		}

		job := &jobs.ImportDemoDataJob{
			Pb:           surmai.Pb,
			AdminEmail:   surmai.AdminEmail,
			DemoEmail:    demoEmail,
			DemoPassword: password,
		}

		surmai.Pb.Cron().MustAdd("ImportDemoDataJob", "0 * * * *", func() {
			job.Execute()
		})

		slog.Info("Starting surmai in demo mode")
	}
}
