package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/schelling/kuro/backend/internal/models"
)

type ListWaehrungenOutput struct {
	Body struct {
		Waehrungen []models.WaehrungInfo `json:"waehrungen"`
	}
}

func RegisterWaehrungen(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "list-waehrungen",
		Method:      http.MethodGet,
		Path:        "/api/waehrungen",
		Summary:     "Unterstützte Währungen auflisten",
		Tags:        []string{"Währungen"},
	}, func(_ context.Context, _ *struct{}) (*ListWaehrungenOutput, error) {
		out := &ListWaehrungenOutput{}
		out.Body.Waehrungen = models.SupportedWaehrungen
		return out, nil
	})
}
