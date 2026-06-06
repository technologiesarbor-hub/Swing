package config

import (
	"fmt"
	"log"
	"strings"
	"time"
)

var selected Configuration

type Configuration struct {
	Setup   string `yaml:"setup"`
	Profile string `yaml:"profile"`
	App     string `yaml:"app"`
	Version string `yaml:"-"`

	Server   ServerYAML   `yaml:"server"`
	Database DatabaseYAML `yaml:"database"`
	Auth     AuthYAML     `yaml:"auth"`
	R2       R2YAML       `yaml:"r2"`
	CORS     CORSYAML     `yaml:"cors"`

	readTimeout     time.Duration
	writeTimeout    time.Duration
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

type ServerYAML struct {
	Port         string `yaml:"port"`
	ReadTimeout  string `yaml:"read_timeout"`
	WriteTimeout string `yaml:"write_timeout"`
}

type DatabaseYAML struct {
	URL string `yaml:"url"`
}

type AuthYAML struct {
	JWTSecret        string   `yaml:"jwt_secret"`
	GoogleClientID   string   `yaml:"google_client_id"`
	GoogleClientIDs  []string `yaml:"google_client_ids"`
	AccessTokenTTL   string   `yaml:"access_token_ttl"`
	RefreshTokenTTL  string   `yaml:"refresh_token_ttl"`
}

func (a AuthYAML) AllowedGoogleClientIDs() []string {
	seen := make(map[string]struct{})
	var out []string
	add := func(id string) {
		id = strings.TrimSpace(id)
		if id == "" {
			return
		}
		if _, ok := seen[id]; ok {
			return
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	for _, id := range a.GoogleClientIDs {
		add(id)
	}
	add(a.GoogleClientID)
	return out
}

type R2YAML struct {
	AccountID       string `yaml:"account_id"`
	AccessKeyID     string `yaml:"access_key_id"`
	SecretAccessKey string `yaml:"secret_access_key"`
	Bucket          string `yaml:"bucket"`
	PublicBaseURL   string `yaml:"public_base_url"`
}

func (r R2YAML) Enabled() bool {
	return strings.TrimSpace(r.AccountID) != "" &&
		strings.TrimSpace(r.AccessKeyID) != "" &&
		strings.TrimSpace(r.SecretAccessKey) != "" &&
		strings.TrimSpace(r.Bucket) != "" &&
		strings.TrimSpace(r.PublicBaseURL) != ""
}

type CORSYAML struct {
	AllowedOrigins []string `yaml:"allowed_origins"`
}

func (c *Configuration) validate() error {
	if c.Database.URL == "" {
		return fmt.Errorf("database.url is required (dev.local.yaml or %s)", envDatabaseURL)
	}
	if c.Auth.JWTSecret == "" {
		return fmt.Errorf("auth.jwt_secret is required (dev.local.yaml or %s)", envJWTSecret)
	}
	return nil
}

func (c *Configuration) parseDurations() error {
	var err error
	c.readTimeout, err = time.ParseDuration(c.Server.ReadTimeout)
	if err != nil {
		return fmt.Errorf("server.read_timeout: %w", err)
	}
	c.writeTimeout, err = time.ParseDuration(c.Server.WriteTimeout)
	if err != nil {
		return fmt.Errorf("server.write_timeout: %w", err)
	}
	c.accessTokenTTL, err = time.ParseDuration(c.Auth.AccessTokenTTL)
	if err != nil {
		return fmt.Errorf("auth.access_token_ttl: %w", err)
	}
	c.refreshTokenTTL, err = time.ParseDuration(c.Auth.RefreshTokenTTL)
	if err != nil {
		return fmt.Errorf("auth.refresh_token_ttl: %w", err)
	}
	return nil
}

func Init() {
	cfg, err := getConfig()
	if err != nil {
		panic(fmt.Sprintf("config error: %v", err))
	}
	selected = cfg
	log.Printf("serving config loaded: setup=%s profile=%s app=%s", selected.Setup, selected.Profile, selected.App)
}

func GetAppName() string {
	return selected.App
}

func GetVersion() string {
	return selected.Version
}

func GetDatabaseURL() string {
	return selected.Database.URL
}

func GetJWTSecret() string {
	return selected.Auth.JWTSecret
}

func GetGoogleClientID() string {
	return selected.Auth.GoogleClientID
}

func GetGoogleClientIDs() []string {
	return selected.Auth.AllowedGoogleClientIDs()
}

func GetAccessTokenTTL() time.Duration {
	return selected.accessTokenTTL
}

func GetRefreshTokenTTL() time.Duration {
	return selected.refreshTokenTTL
}

func GetAllowedOrigins() []string {
	if len(selected.CORS.AllowedOrigins) == 0 {
		return []string{"*"}
	}
	return selected.CORS.AllowedOrigins
}

func IsDev() bool {
	p := selected.Profile
	return p == "dev" || p == "local" || p == "staging"
}

func GetR2() R2YAML {
	return selected.R2
}
