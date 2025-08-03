package main

import (
	"backend/types"
	_ "embed"
	"strings"
)

//go:embed git-describe.txt
var GitDescribe string

func GetRevisionInfo() types.VersionInfo {
	if GitDescribe == "" {
		return types.VersionInfo{Tag: "dev"}
	}

	split := strings.Split(GitDescribe, "-")
	return types.VersionInfo{Tag: split[0], Commit: split[2][1:], Dirty: split[1] != "0"}

}
