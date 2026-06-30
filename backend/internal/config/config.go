package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
}

type ServerConfig struct {
	Host string
	Port int
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type AuthConfig struct {
	Provider     string
	DevPassword  string
	TokenSecret  string
	TokenTTLHours int
	LDAP         LDAPConfig
	OIDC         OIDCConfig
}

type LDAPConfig struct {
	URL          string
	BaseDN       string
	UserFilter   string
	BindDN       string
	BindPassword string
}

type OIDCConfig struct {
	Issuer       string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

func Load() Config {
	return Config{
		Server: ServerConfig{
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Port: getEnvInt("SERVER_PORT", 8080),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "kuro"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Auth: AuthConfig{
			Provider:      getEnv("AUTH_PROVIDER", "ldap"),
			DevPassword:   getEnv("DEV_AUTH_PASSWORD", "123456"),
			TokenSecret:   getEnv("AUTH_TOKEN_SECRET", "change-me-in-production"),
			TokenTTLHours: getEnvInt("AUTH_TOKEN_TTL_HOURS", 8),
			LDAP: LDAPConfig{
				URL:          getEnv("LDAP_URL", "ldap://localhost:389"),
				BaseDN:       getEnv("LDAP_BASE_DN", "DC=example,DC=local"),
				UserFilter:   getEnv("LDAP_USER_FILTER", "(sAMAccountName=%s)"),
				BindDN:       getEnv("LDAP_BIND_DN", ""),
				BindPassword: getEnv("LDAP_BIND_PASSWORD", ""),
			},
			OIDC: OIDCConfig{
				Issuer:       getEnv("OIDC_ISSUER", ""),
				ClientID:     getEnv("OIDC_CLIENT_ID", ""),
				ClientSecret: getEnv("OIDC_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OIDC_REDIRECT_URL", "http://localhost:3000/api/auth/callback"),
			},
		},
	}
}

func (d DatabaseConfig) DSN() string {
	return "host=" + d.Host +
		" user=" + d.User +
		" password=" + d.Password +
		" dbname=" + d.DBName +
		" port=" + strconv.Itoa(d.Port) +
		" sslmode=" + d.SSLMode
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
