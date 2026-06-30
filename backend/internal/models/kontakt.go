package models

import "time"

type KontaktStandort string

const (
	KontaktStandortSR KontaktStandort = "SR"
	KontaktStandortSS KontaktStandort = "SS"
	KontaktStandortSO KontaktStandort = "SO"
	KontaktStandortSB KontaktStandort = "SB"
)

var ValidKontaktStandorte = []KontaktStandort{
	KontaktStandortSR,
	KontaktStandortSS,
	KontaktStandortSO,
	KontaktStandortSB,
}

func IsValidKontaktStandort(s KontaktStandort) bool {
	switch s {
	case KontaktStandortSR, KontaktStandortSS, KontaktStandortSO, KontaktStandortSB:
		return true
	default:
		return false
	}
}

type Kontakt struct {
	ID        uint            `gorm:"primaryKey" json:"id"`
	Vorname   string          `gorm:"size:100" json:"vorname"`
	Nachname  string          `gorm:"size:100;not null" json:"nachname"`
	Email     string          `gorm:"size:255" json:"email"`
	Telefon   string          `gorm:"size:50" json:"telefon"`
	Standort  KontaktStandort `gorm:"size:2;not null" json:"standort"`
	DebitorID uint            `gorm:"not null;index" json:"debitorId"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}
