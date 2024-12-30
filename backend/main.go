package main

import (
	_ "backend/migrations"
	"github.com/pocketbase/pocketbase"
	"log"
	"os"
	"strings"
)

type SurmaiApp struct {
	pb         *pocketbase.PocketBase
	DemoMode   bool
	AdminEmail string
}

func main() {

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	surmai := &SurmaiApp{
		pb: pocketbase.NewWithConfig(pocketbase.Config{
			DefaultDev:     isGoRun,
			DefaultDataDir: os.Getenv("PB_DATA_DIRECTORY"),
		}),
		DemoMode:   os.Getenv("SURMAI_DEMO_MODE") == "true",
		AdminEmail: os.Getenv("SURMAI_ADMIN_EMAIL"),
	}

	surmai.bindMigrations(isGoRun)
	surmai.bindRoutes()
	surmai.startDemoMode()

	if err := surmai.pb.Start(); err != nil {
		log.Fatal(err)
	}
}
