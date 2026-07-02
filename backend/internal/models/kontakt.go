package models

import "time"

type Kontakt struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Vorname   string    `gorm:"size:100" json:"vorname"`
	Nachname  string    `gorm:"size:100;not null" json:"nachname"`
	Email     string    `gorm:"size:255" json:"email"`
	Telefon   string    `gorm:"size:50" json:"telefon"`
	DebitorID uint      `gorm:"not null;index" json:"debitorId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
