package main

import (
	"backend/app"
	_ "backend/migrations"
	"log"
	"os"
	"strings"
)

func main() {

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	surmai := app.InitializeSurmai(isGoRun)

	// Start pocketbase
	if err := surmai.Pb.Start(); err != nil {
		log.Fatal(err)
	}
}
