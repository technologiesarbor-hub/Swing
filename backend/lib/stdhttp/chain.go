package stdhttp

import (
	"log/slog"
	"net/http"
	"os"
)

// Chain applies middleware outer-to-inner (stdlib router helper).
func Chain(h http.Handler, middleware ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middleware) - 1; i >= 0; i-- {
		h = middleware[i](h)
	}
	return h
}

var recoverLog = slog.New(slog.NewJSONHandler(os.Stdout, nil))

// Recover catches panics and returns 500.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				recoverLog.Error("panic recovered",
					"panic", rec,
					"method", r.Method,
					"path", r.URL.Path,
				)
				http.Error(w, `{"error":{"code":"INTERNAL","message":"Something went wrong."}}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
