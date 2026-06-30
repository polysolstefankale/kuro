package provider

import (
	"fmt"

	"github.com/schelling/kuro/backend/internal/auth"
	"github.com/schelling/kuro/backend/internal/auth/ldap"
	"github.com/schelling/kuro/backend/internal/auth/oidc"
	"github.com/schelling/kuro/backend/internal/config"
)

// NewService creates the configured auth implementation.
// Switch providers via AUTH_PROVIDER=ldap|oidc in the environment.
func NewService(cfg config.AuthConfig) (auth.Service, error) {
	switch auth.Provider(cfg.Provider) {
	case auth.ProviderLDAP:
		return ldap.New(ldap.Config{
			URL:          cfg.LDAP.URL,
			BaseDN:       cfg.LDAP.BaseDN,
			UserFilter:   cfg.LDAP.UserFilter,
			BindDN:       cfg.LDAP.BindDN,
			BindPassword: cfg.LDAP.BindPassword,
			DevPassword:  cfg.DevPassword,
		}), nil
	case auth.ProviderOIDC:
		return oidc.New(oidc.Config{
			Issuer:       cfg.OIDC.Issuer,
			ClientID:     cfg.OIDC.ClientID,
			ClientSecret: cfg.OIDC.ClientSecret,
			RedirectURL:  cfg.OIDC.RedirectURL,
		}), nil
	default:
		return nil, fmt.Errorf("auth: unknown provider %q", cfg.Provider)
	}
}
