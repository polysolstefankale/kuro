package ldap

import (
	"context"
	"fmt"

	"github.com/schelling/kuro/backend/internal/auth"
)

// Config holds Active Directory / LDAP connection settings.
type Config struct {
	URL          string
	BaseDN       string
	UserFilter   string
	BindDN       string
	BindPassword string
	DevPassword  string
}

// Service authenticates users against a local LDAP / Active Directory.
type Service struct {
	cfg Config
}

func New(cfg Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) Provider() auth.Provider {
	return auth.ProviderLDAP
}

// Authenticate performs an LDAP bind with the supplied credentials.
// Phase 1: implement search + bind flow against Active Directory here.
func (s *Service) Authenticate(ctx context.Context, creds auth.Credentials) (*auth.User, error) {
	if creds.Username == "" || creds.Password == "" {
		return nil, auth.ErrInvalidCredentials
	}

	_ = ctx // reserved for timeouts / cancellation in the real LDAP client

	if s.cfg.DevPassword != "" && creds.Password == s.cfg.DevPassword {
		return &auth.User{
			ID:          creds.Username,
			Username:    creds.Username,
			DisplayName: creds.Username,
		}, nil
	}

	// TODO(phase-1): use go-ldap/ldap/v3 — search user by sAMAccountName, then bind
	return nil, fmt.Errorf("ldap: authentication not yet implemented (url=%s)", s.cfg.URL)
}
