package routes

import (
	"net/http"

	"lib/stdcors"
	"lib/stdhttp"

	"serving/config"
)

func buildCORSMiddleware() func(http.Handler) http.Handler {
	return stdcors.Middleware(stdcors.Options{
		AllowedOrigins: config.GetAllowedOrigins(),
		AllowedMethods: []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:         300,
	})
}

func wrapAPI(handler http.Handler) http.Handler {
	return stdhttp.Chain(handler,
		stdhttp.Recover,
		buildCORSMiddleware(),
	)
}
