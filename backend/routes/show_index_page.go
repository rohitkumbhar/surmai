package routes

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
	"os"
)

func ShowIndexPage(e *core.RequestEvent) error {
	return e.FileFS(os.DirFS("./pb_public"), router.IndexPage)
}
