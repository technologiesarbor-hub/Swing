package config

import "time"

func GetSetup() string {
	return selected.Setup
}

func GetProfile() string {
	return selected.Profile
}

func GetPort() string {
	port := selected.Server.Port
	if port == "" {
		port = "8080"
	}
	if port[0] != ':' {
		return ":" + port
	}
	return port
}

func GetServerReadTimeout() time.Duration {
	return selected.readTimeout
}

func GetServerWriteTimeout() time.Duration {
	return selected.writeTimeout
}
