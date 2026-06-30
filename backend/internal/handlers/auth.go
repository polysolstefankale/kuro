package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/schelling/kuro/backend/internal/auth"
	"github.com/schelling/kuro/backend/internal/auth/token"
)

type LoginInput struct {
	Body struct {
		Username string `json:"username" minLength:"1" doc:"Benutzername (sAMAccountName)"`
		Password string `json:"password" minLength:"1" doc:"Passwort"`
	}
}

type LoginOutput struct {
	Body struct {
		Token    string `json:"token" doc:"Bearer-Token für API-Aufrufe"`
		Username string `json:"username"`
		Provider string `json:"provider" doc:"Aktiver Auth-Provider"`
	}
}

func RegisterAuth(api huma.API, authService auth.Service, tokenSecret string, tokenTTL time.Duration) {
	huma.Register(api, huma.Operation{
		OperationID: "login",
		Method:      http.MethodPost,
		Path:        "/api/auth/login",
		Summary:     "Benutzer anmelden",
		Description: "Authentifiziert Benutzername und Passwort über den konfigurierten Auth-Provider.",
		Tags:        []string{"Auth"},
	}, func(ctx context.Context, input *LoginInput) (*LoginOutput, error) {
		user, err := authService.Authenticate(ctx, auth.Credentials{
			Username: input.Body.Username,
			Password: input.Body.Password,
		})
		if err != nil {
			if errors.Is(err, auth.ErrInvalidCredentials) {
				return nil, huma.Error401Unauthorized("Ungültige Anmeldedaten")
			}
			return nil, huma.Error401Unauthorized("Anmeldung fehlgeschlagen", err)
		}

		accessToken, err := token.Issue(user.Username, tokenSecret, tokenTTL)
		if err != nil {
			return nil, huma.Error500InternalServerError("Token konnte nicht erstellt werden", err)
		}

		out := &LoginOutput{}
		out.Body.Token = accessToken
		out.Body.Username = user.Username
		out.Body.Provider = string(authService.Provider())
		return out, nil
	})
}
