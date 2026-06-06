package controllers

import (
	"fmt"
	"net/http"

	"serving/config"
)

func Health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = fmt.Fprintf(w, `{"app":"%s","status":"healthy","cv":"%s"}`, config.GetAppName(), config.GetVersion())
}
