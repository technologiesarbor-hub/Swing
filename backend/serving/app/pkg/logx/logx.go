// Package logx provides structured server logging (stdlib slog).
package logx

import (
	"log/slog"
	"net/http"
	"os"
)

var logger *slog.Logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelInfo,
}))

// Init sets log level from profile (debug in dev/local).
func Init(dev bool) {
	level := slog.LevelInfo
	if dev {
		level = slog.LevelDebug
	}
	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
}

func Info(msg string, attrs ...any) {
	logger.Info(msg, attrs...)
}

func Error(msg string, err error, attrs ...any) {
	args := append([]any{"err", err.Error()}, attrs...)
	logger.Error(msg, args...)
}

// RequestAttrs returns common HTTP fields for logs (no bodies, no passwords).
func RequestAttrs(r *http.Request) []any {
	if r == nil {
		return nil
	}
	return []any{
		"method", r.Method,
		"path", r.URL.Path,
		"remote", r.RemoteAddr,
	}
}
