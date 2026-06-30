package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/schelling/kuro/backend/internal/models"
	"gorm.io/gorm"
)

type kontaktFields struct {
	Vorname   string `json:"vorname,omitempty" maxLength:"100"`
	Nachname  string `json:"nachname" minLength:"1" maxLength:"100"`
	Email     string `json:"email,omitempty" maxLength:"255"`
	Telefon   string `json:"telefon,omitempty" maxLength:"50"`
	Standort  string `json:"standort" enum:"SR,SS,SO,SB"`
	DebitorID uint   `json:"debitorId" doc:"Zugehöriger Debitor"`
}

type KontaktOutput struct {
	Body models.Kontakt
}

type ListKontakteInput struct {
	DebitorID uint `query:"debitorId" doc:"Debitor-ID"`
}

type ListKontakteOutput struct {
	Body struct {
		Kontakte []models.Kontakt `json:"kontakte"`
	}
}

type CreateKontaktInput struct {
	Body kontaktFields
}

type UpdateKontaktInput struct {
	ID   uint `path:"id" doc:"Kontakt-ID"`
	Body kontaktFields
}

type KontaktIDInput struct {
	ID uint `path:"id" doc:"Kontakt-ID"`
}

func RegisterKontakte(api huma.API, db *gorm.DB) {
	huma.Register(api, huma.Operation{
		OperationID: "list-kontakte",
		Method:      http.MethodGet,
		Path:        "/api/kontakte",
		Summary:     "Kontakte eines Debitors auflisten",
		Tags:        []string{"Kontakte"},
	}, func(ctx context.Context, input *ListKontakteInput) (*ListKontakteOutput, error) {
		if input.DebitorID == 0 {
			return nil, huma.Error400BadRequest("debitorId ist erforderlich")
		}

		var debitor models.Debitor
		if err := db.WithContext(ctx).First(&debitor, input.DebitorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, huma.Error404NotFound("Debitor nicht gefunden")
			}
			return nil, huma.Error500InternalServerError("Debitor konnte nicht geladen werden", err)
		}

		var kontakte []models.Kontakt
		if err := db.WithContext(ctx).
			Where("debitor_id = ?", input.DebitorID).
			Order("nachname asc, vorname asc").
			Find(&kontakte).Error; err != nil {
			return nil, huma.Error500InternalServerError("Kontakte konnten nicht geladen werden", err)
		}

		out := &ListKontakteOutput{}
		out.Body.Kontakte = kontakte
		return out, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-kontakt",
		Method:      http.MethodPost,
		Path:        "/api/kontakte",
		Summary:     "Kontakt anlegen",
		Tags:        []string{"Kontakte"},
	}, func(ctx context.Context, input *CreateKontaktInput) (*KontaktOutput, error) {
		kontakt, err := fieldsToKontakt(input.Body)
		if err != nil {
			return nil, huma.Error400BadRequest(err.Error())
		}

		if err := ensureDebitorExists(ctx, db, kontakt.DebitorID); err != nil {
			return nil, err
		}

		if err := db.WithContext(ctx).Create(kontakt).Error; err != nil {
			return nil, huma.Error500InternalServerError("Kontakt konnte nicht angelegt werden", err)
		}

		return &KontaktOutput{Body: *kontakt}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-kontakt",
		Method:      http.MethodPut,
		Path:        "/api/kontakte/{id}",
		Summary:     "Kontakt aktualisieren",
		Tags:        []string{"Kontakte"},
	}, func(ctx context.Context, input *UpdateKontaktInput) (*KontaktOutput, error) {
		var existing models.Kontakt
		if err := db.WithContext(ctx).First(&existing, input.ID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, huma.Error404NotFound("Kontakt nicht gefunden")
			}
			return nil, huma.Error500InternalServerError("Kontakt konnte nicht geladen werden", err)
		}

		updated, err := fieldsToKontakt(input.Body)
		if err != nil {
			return nil, huma.Error400BadRequest(err.Error())
		}

		if updated.DebitorID != existing.DebitorID {
			if err := ensureDebitorExists(ctx, db, updated.DebitorID); err != nil {
				return nil, err
			}
		}

		existing.Vorname = updated.Vorname
		existing.Nachname = updated.Nachname
		existing.Email = updated.Email
		existing.Telefon = updated.Telefon
		existing.Standort = updated.Standort
		existing.DebitorID = updated.DebitorID

		if err := db.WithContext(ctx).Save(&existing).Error; err != nil {
			return nil, huma.Error500InternalServerError("Kontakt konnte nicht aktualisiert werden", err)
		}

		return &KontaktOutput{Body: existing}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-kontakt",
		Method:      http.MethodDelete,
		Path:        "/api/kontakte/{id}",
		Summary:     "Kontakt löschen",
		Tags:        []string{"Kontakte"},
	}, func(ctx context.Context, input *KontaktIDInput) (*struct{}, error) {
		result := db.WithContext(ctx).Delete(&models.Kontakt{}, input.ID)
		if result.Error != nil {
			return nil, huma.Error500InternalServerError("Kontakt konnte nicht gelöscht werden", result.Error)
		}
		if result.RowsAffected == 0 {
			return nil, huma.Error404NotFound("Kontakt nicht gefunden")
		}
		return nil, nil
	})
}

func fieldsToKontakt(body kontaktFields) (*models.Kontakt, error) {
	if body.Nachname == "" {
		return nil, errors.New("nachname ist erforderlich")
	}
	if body.DebitorID == 0 {
		return nil, errors.New("debitorId ist erforderlich")
	}

	standort := models.KontaktStandort(body.Standort)
	if !models.IsValidKontaktStandort(standort) {
		return nil, errors.New("standort muss SR, SS, SO oder SB sein")
	}

	return &models.Kontakt{
		Vorname:   body.Vorname,
		Nachname:  body.Nachname,
		Email:     body.Email,
		Telefon:   body.Telefon,
		Standort:  standort,
		DebitorID: body.DebitorID,
	}, nil
}

func ensureDebitorExists(ctx context.Context, db *gorm.DB, debitorID uint) error {
	var count int64
	if err := db.WithContext(ctx).Model(&models.Debitor{}).Where("id = ?", debitorID).Count(&count).Error; err != nil {
		return huma.Error500InternalServerError("Debitor konnte nicht geprüft werden", err)
	}
	if count == 0 {
		return huma.Error404NotFound("Debitor nicht gefunden")
	}
	return nil
}
