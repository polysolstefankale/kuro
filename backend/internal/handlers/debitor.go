package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/schelling/kuro/backend/internal/models"
	"gorm.io/gorm"
)

type debitorFields struct {
	Name        string               `json:"name" minLength:"1" maxLength:"255" doc:"Firmen- oder Personenname"`
	Strasse     string               `json:"strasse,omitempty" maxLength:"255"`
	PLZ         string               `json:"plz,omitempty" maxLength:"20"`
	Ort         string               `json:"ort,omitempty" maxLength:"100"`
	Land        string               `json:"land,omitempty" maxLength:"100"`
	Umsatz      float64              `json:"umsatz,omitempty" doc:"Kumulierter Umsatz"`
	Waehrung    string               `json:"waehrung,omitempty" maxLength:"3" doc:"ISO-4217 Währungscode"`
	Status      models.DebitorStatus `json:"status,omitempty" enum:"Aktiv,Inaktiv"`
	Hauptnummer string               `json:"hauptnummer,omitempty" maxLength:"50" doc:"Telefon-Hauptnummer"`
}

type DebitorOutput struct {
	Body models.Debitor
}

type ListDebitorenOutput struct {
	Body struct {
		Debitoren []models.Debitor `json:"debitoren"`
	}
}

type CreateDebitorInput struct {
	Body debitorFields
}

type UpdateDebitorInput struct {
	ID   uint `path:"id" doc:"Debitor-ID"`
	Body debitorFields
}

type DebitorIDInput struct {
	ID uint `path:"id" doc:"Debitor-ID"`
}

func RegisterDebitoren(api huma.API, db *gorm.DB) {
	huma.Register(api, huma.Operation{
		OperationID: "list-debitoren",
		Method:      http.MethodGet,
		Path:        "/api/debitoren",
		Summary:     "Debitoren auflisten",
		Tags:        []string{"Debitoren"},
	}, func(ctx context.Context, _ *struct{}) (*ListDebitorenOutput, error) {
		var debitoren []models.Debitor
		if err := db.WithContext(ctx).Order("debitor_nummer asc").Find(&debitoren).Error; err != nil {
			return nil, huma.Error500InternalServerError("Debitoren konnten nicht geladen werden", err)
		}
		out := &ListDebitorenOutput{}
		out.Body.Debitoren = debitoren
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-debitor",
		Method:      http.MethodPost,
		Path:        "/api/debitoren",
		Summary:     "Debitor anlegen",
		Tags:        []string{"Debitoren"},
	}, func(ctx context.Context, input *CreateDebitorInput) (*DebitorOutput, error) {
		debitor, err := fieldsToDebitor(input.Body)
		if err != nil {
			return nil, huma.Error400BadRequest(err.Error())
		}

		for attempt := 0; attempt < 3; attempt++ {
			nummer, genErr := models.NextDebitorNummer(ctx, db)
			if genErr != nil {
				return nil, huma.Error500InternalServerError("Debitornummer konnte nicht erzeugt werden", genErr)
			}
			debitor.DebitorNummer = nummer

			if err := db.WithContext(ctx).Create(debitor).Error; err != nil {
				if isUniqueViolation(err) {
					continue
				}
				return nil, huma.Error500InternalServerError("Debitor konnte nicht angelegt werden", err)
			}

			return &DebitorOutput{Body: *debitor}, nil
		}

		return nil, huma.Error409Conflict("Debitornummer konnte nicht vergeben werden, bitte erneut versuchen")
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-debitor",
		Method:      http.MethodPut,
		Path:        "/api/debitoren/{id}",
		Summary:     "Debitor aktualisieren",
		Tags:        []string{"Debitoren"},
	}, func(ctx context.Context, input *UpdateDebitorInput) (*DebitorOutput, error) {
		var existing models.Debitor
		if err := db.WithContext(ctx).First(&existing, input.ID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, huma.Error404NotFound("Debitor nicht gefunden")
			}
			return nil, huma.Error500InternalServerError("Debitor konnte nicht geladen werden", err)
		}

		updated, err := fieldsToDebitor(input.Body)
		if err != nil {
			return nil, huma.Error400BadRequest(err.Error())
		}

		existing.Name = updated.Name
		existing.Strasse = updated.Strasse
		existing.PLZ = updated.PLZ
		existing.Ort = updated.Ort
		existing.Land = updated.Land
		existing.Umsatz = updated.Umsatz
		existing.Waehrung = updated.Waehrung
		existing.Status = updated.Status
		existing.Hauptnummer = updated.Hauptnummer

		if err := db.WithContext(ctx).Save(&existing).Error; err != nil {
			if isUniqueViolation(err) {
				return nil, huma.Error409Conflict("Debitornummer existiert bereits")
			}
			return nil, huma.Error500InternalServerError("Debitor konnte nicht aktualisiert werden", err)
		}

		return &DebitorOutput{Body: existing}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-debitor",
		Method:      http.MethodDelete,
		Path:        "/api/debitoren/{id}",
		Summary:     "Debitor löschen",
		Tags:        []string{"Debitoren"},
	}, func(ctx context.Context, input *DebitorIDInput) (*struct{}, error) {
		result := db.WithContext(ctx).Delete(&models.Debitor{}, input.ID)
		if result.Error != nil {
			return nil, huma.Error500InternalServerError("Debitor konnte nicht gelöscht werden", result.Error)
		}
		if result.RowsAffected == 0 {
			return nil, huma.Error404NotFound("Debitor nicht gefunden")
		}
		return nil, nil
	})
}

func fieldsToDebitor(body debitorFields) (*models.Debitor, error) {
	if body.Name == "" {
		return nil, errors.New("name ist erforderlich")
	}

	status := body.Status
	if status == "" {
		status = models.DebitorStatusAktiv
	}
	if status != models.DebitorStatusAktiv && status != models.DebitorStatusInaktiv {
		return nil, errors.New("status muss Aktiv oder Inaktiv sein")
	}

	waehrung := models.NormalizeWaehrung(body.Waehrung)
	if !models.IsValidWaehrung(waehrung) {
		return nil, errors.New("waehrung ist ungültig")
	}

	return &models.Debitor{
		Name:        body.Name,
		Strasse:     body.Strasse,
		PLZ:         body.PLZ,
		Ort:         body.Ort,
		Land:        body.Land,
		Umsatz:      body.Umsatz,
		Waehrung:    waehrung,
		Status:      status,
		Hauptnummer: body.Hauptnummer,
	}, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}
	msg := err.Error()
	return strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique constraint")
}
