package models

import "time"

type DebitorStatus string

const (
	DebitorStatusAktiv   DebitorStatus = "Aktiv"
	DebitorStatusInaktiv DebitorStatus = "Inaktiv"
)

type Debitor struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	DebitorNummer string        `gorm:"uniqueIndex;size:50;not null" json:"debitorNummer"`
	Name          string        `gorm:"size:255;not null" json:"name"`
	Strasse       string        `gorm:"size:255" json:"strasse"`
	PLZ           string        `gorm:"size:20" json:"plz"`
	Ort           string        `gorm:"size:100" json:"ort"`
	Land          string        `gorm:"size:100" json:"land"`
	Umsatz        float64       `gorm:"type:numeric(18,2);default:0" json:"umsatz"`
	Waehrung      string        `gorm:"size:3;not null;default:CHF" json:"waehrung"`
	Status        DebitorStatus `gorm:"size:20;not null;default:Aktiv" json:"status"`
	Hauptnummer   string        `gorm:"size:50" json:"hauptnummer"`
	Kontakte      []Kontakt     `gorm:"foreignKey:DebitorID;constraint:OnDelete:CASCADE" json:"kontakte,omitempty"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
}
