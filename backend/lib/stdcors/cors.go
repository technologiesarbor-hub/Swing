package stdcors

import (
	"net/http"
	"strings"
)

// Options configures development CORS (stdlib only — no go-chi/cors).
type Options struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
	MaxAge         int
}

func Middleware(opts Options) func(http.Handler) http.Handler {
	methods := strings.Join(opts.AllowedMethods, ", ")
	headers := strings.Join(opts.AllowedHeaders, ", ")
	allowAll := len(opts.AllowedOrigins) == 1 && opts.AllowedOrigins[0] == "*"

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				if allowAll || originAllowed(origin, opts.AllowedOrigins) {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					if !allowAll {
						w.Header().Add("Vary", "Origin")
					}
				}
				w.Header().Set("Access-Control-Allow-Methods", methods)
				w.Header().Set("Access-Control-Allow-Headers", headers)
				if opts.MaxAge > 0 {
					w.Header().Set("Access-Control-Max-Age", strconvItoa(opts.MaxAge))
				}
				if r.Method == http.MethodOptions {
					w.WriteHeader(http.StatusNoContent)
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func originAllowed(origin string, allowed []string) bool {
	for _, o := range allowed {
		if o == origin {
			return true
		}
	}
	return false
}

func strconvItoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [12]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}
