package datasets

import "path/filepath"

// Dir is where the bundled dataset files live, relative to the working
// directory. It is a variable so tests can point at the files directly.
var Dir = "./datasets"

func datasetPath(name string) string {
	return filepath.Join(Dir, name)
}
