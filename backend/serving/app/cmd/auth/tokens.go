package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"

	"lib/stdid"
	"lib/stdjwt"
)

type TokenService struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewTokenService(secret string, accessTTL, refreshTTL time.Duration) *TokenService {
	return &TokenService{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

func (s *TokenService) IssueAccess(userID stdid.UUID) (string, time.Time, error) {
	exp := time.Now().UTC().Add(s.accessTTL)
	token, err := stdjwt.IssueHS256(s.secret, map[string]any{
		"sub": userID.String(),
		"exp": exp.Unix(),
		"iat": time.Now().UTC().Unix(),
		"typ": "access",
	})
	if err != nil {
		return "", time.Time{}, err
	}
	return token, exp, nil
}

func (s *TokenService) ParseAccess(tokenStr string) (stdid.UUID, error) {
	claims, err := stdjwt.ParseHS256(s.secret, tokenStr)
	if err != nil {
		return stdid.UUID{}, err
	}
	sub, _ := claims["sub"].(string)
	return stdid.Parse(sub)
}

func (s *TokenService) IssueRefresh() (raw string, hash string, expiresAt time.Time, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", "", time.Time{}, err
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	hash = HashRefreshToken(raw)
	expiresAt = time.Now().UTC().Add(s.refreshTTL)
	return raw, hash, expiresAt, nil
}

func HashRefreshToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
