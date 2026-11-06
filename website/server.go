// Local server for the eo website.
//   go run server.go          →  http://localhost:8080
//   go run server.go 3000     →  http://localhost:3000
// The playground loads eo.wasm, which browsers only allow over http(s), not from file://.
package main

import (
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
)

func main() {
	port := "8080"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}
	mime.AddExtensionType(".wasm", "application/wasm")
	mime.AddExtensionType(".vsix", "application/octet-stream")
	fmt.Printf("eo website: http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, http.FileServer(http.Dir("."))))
}
