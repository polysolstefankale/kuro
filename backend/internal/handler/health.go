package handler

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

type HealthOutput struct {
	Body struct {
		Status   string `json:"status" example:"ok" doc:"Overall service status"`
		Database string `json:"database" example:"connected" doc:"PostgreSQL connection status"`
		Auth     string `json:"auth" example:"ldap" doc:"Active authentication provider"`
	}
}

func RegisterHealth(api huma.API, db *gorm.DB, authProvider string) {
	huma.Register(api, huma.Operation{
		OperationID: "get-health",
		Method:      http.MethodGet,
		Path:        "/health",
		Summary:     "Health check",
		Description: "Verifies API availability and PostgreSQL connectivity.",
		Tags:        []string{"System"},
	}, func(ctx context.Context, _ *struct{}) (*HealthOutput, error) {
		dbStatus := "connected"
		if sqlDB, err := db.DB(); err != nil || sqlDB.PingContext(ctx) != nil {
			dbStatus = "disconnected"
		}

		status := "ok"
		if dbStatus != "connected" {
			status = "degraded"
		}

		out := &HealthOutput{}
		out.Body.Status = status
		out.Body.Database = dbStatus
		out.Body.Auth = authProvider
		return out, nil
	})
}
