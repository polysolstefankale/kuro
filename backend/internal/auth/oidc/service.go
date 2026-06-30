package oidc

import (
	"context"
	"fmt"

	"github.com/schelling/kuro/backend/internal/auth"
)

// Config holds Microsoft Entra ID / OIDC settings for Phase 2.
type Config struct {
	Issuer       string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

// Service validates OIDC tokens issued by Microsoft Entra ID.
type Service struct {
	cfg Config
}

func New(cfg Config) *Service {
	return &Service{cfg: cfg}
}

func (s *Service) Provider() auth.Provider {
	return auth.ProviderOIDC
}

// Authenticate validates an OIDC ID or access token.
// The OAuth authorization-code flow is handled in HTTP handlers; this method
// only resolves the token to an application user.
func (s *Service) Authenticate(ctx context.Context, creds auth.Credentials) (*auth.User, error) {
	if creds.Token == "" {
		return nil, auth.ErrInvalidCredentials
	}

	_ = ctx

	// TODO(phase-2): use coreos/go-oidc or similar to validate Entra ID tokens
	return nil, fmt.Errorf("oidc: authentication not yet implemented (issuer=%s)", s.cfg.Issuer)
}
