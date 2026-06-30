package models

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"gorm.io/gorm"
)

// NextDebitorNummer returns the next available number in the format D000001.
func NextDebitorNummer(ctx context.Context, db *gorm.DB) (string, error) {
	var last Debitor
	err := db.WithContext(ctx).
		Where("debitor_nummer ~ ?", "^D[0-9]{6}$").
		Order("debitor_nummer DESC").
		First(&last).Error

	next := 1
	if err == nil {
		n, parseErr := strconv.Atoi(last.DebitorNummer[1:])
		if parseErr != nil {
			return "", fmt.Errorf("debitor nummer: parse last number: %w", parseErr)
		}
		next = n + 1
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", fmt.Errorf("debitor nummer: query failed: %w", err)
	}

	if next > 999999 {
		return "", errors.New("keine freien Debitornummern mehr verfügbar")
	}

	return fmt.Sprintf("D%06d", next), nil
}
