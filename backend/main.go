package main

import (
	"backend/app"
	"backend/cache"
	_ "backend/migrations"
	"log"
	"os"
	"strings"

	_ "github.com/joho/godotenv/autoload"
	"github.com/pocketbase/pocketbase"
)

func main() {

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	surmai := &app.SurmaiApp{
		Pb: pocketbase.NewWithConfig(pocketbase.Config{
			DefaultDev:     isGoRun,
			DefaultDataDir: os.Getenv("PB_DATA_DIRECTORY"),
		}),
		DemoMode:   os.Getenv("SURMAI_DEMO_MODE") == "true",
		AdminEmail: os.Getenv("SURMAI_ADMIN_EMAIL"),
		Version:    GetRevisionInfo(),
	}

	cache.InitCache()
	surmai.BuildTimezoneFinder()
	surmai.BindMigrations(isGoRun)
	surmai.BindRoutes()
	surmai.BindEventHooks()
	surmai.StartJobs()

	if err := surmai.Pb.Start(); err != nil {
		log.Fatal(err)
	}
}
