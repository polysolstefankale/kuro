package token

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

var ErrInvalidToken = errors.New("token: invalid or expired")

func Issue(username, secret string, ttl time.Duration) (string, error) {
	if username == "" || secret == "" {
		return "", errors.New("token: username and secret required")
	}

	expiresAt := time.Now().Add(ttl).Unix()
	payload := fmt.Sprintf("%s|%d", username, expiresAt)
	signature := sign(payload, secret)

	return base64.RawURLEncoding.EncodeToString([]byte(payload)) + "." + signature, nil
}

func Validate(token, secret string) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", ErrInvalidToken
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", ErrInvalidToken
	}

	payload := string(payloadBytes)
	if sign(payload, secret) != parts[1] {
		return "", ErrInvalidToken
	}

	segments := strings.Split(payload, "|")
	if len(segments) != 2 {
		return "", ErrInvalidToken
	}

	expiresAt, err := strconv.ParseInt(segments[1], 10, 64)
	if err != nil || time.Now().Unix() > expiresAt {
		return "", ErrInvalidToken
	}

	return segments[0], nil
}

func sign(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
