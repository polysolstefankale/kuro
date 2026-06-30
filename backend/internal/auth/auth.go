package auth

import (
	"context"
	"errors"
)

// Provider identifies the active authentication backend.
type Provider string

const (
	ProviderLDAP Provider = "ldap"
	ProviderOIDC Provider = "oidc"
)

var (
	ErrInvalidCredentials = errors.New("auth: invalid credentials")
	ErrNotSupported       = errors.New("auth: operation not supported by provider")
)

// User represents an authenticated principal, independent of the auth backend.
type User struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	DisplayName string   `json:"displayName"`
	Email       string   `json:"email"`
	Groups      []string `json:"groups,omitempty"`
}

// Credentials holds login data. Which fields are required depends on the provider.
//
// LDAP (Phase 1): Username + Password
// OIDC (Phase 2): Token (ID or access token after code exchange in the HTTP layer)
type Credentials struct {
	Username string
	Password string
	Token    string
}

// Service is the central contract for authentication.
// Implementations: ldap.Service (Active Directory) and oidc.Service (Entra ID).
type Service interface {
	Provider() Provider
	Authenticate(ctx context.Context, creds Credentials) (*User, error)
}
