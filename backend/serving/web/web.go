package web

import (
	"context"
	"log"
	"net/http"

	"serving/config"
	"serving/web/routes"
)

var srv *http.Server

func Start() {
	handler := http.NewServeMux()
	routes.Init()
	routes.AddRoutes(handler)

	srv = &http.Server{
		Addr:         config.GetPort(),
		Handler:      handler,
		ReadTimeout:  config.GetServerReadTimeout(),
		WriteTimeout: config.GetServerWriteTimeout(),
	}

	go func() {
		log.Printf("serving listening on http://localhost%s", config.GetPort())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()
}

func ShutDown() {
	if srv == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), config.GetServerWriteTimeout())
	defer cancel()
	_ = srv.Shutdown(ctx)
}
