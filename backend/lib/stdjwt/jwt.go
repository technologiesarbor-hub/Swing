package stdjwt

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// IssueHS256 builds a compact JWT with typ=JWT, alg=HS256 (stdlib only).
func IssueHS256(secret []byte, claims map[string]any) (string, error) {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	body := base64.RawURLEncoding.EncodeToString(payload)
	sig := sign(secret, header+"."+body)
	return header + "." + body + "." + base64.RawURLEncoding.EncodeToString(sig), nil
}

// ParseHS256 verifies signature and returns claims.
func ParseHS256(secret []byte, token string) (map[string]any, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token")
	}
	expected := sign(secret, parts[0]+"."+parts[1])
	got, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("invalid signature")
	}
	if !hmac.Equal(expected, got) {
		return nil, fmt.Errorf("invalid signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	var claims map[string]any
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, err
	}
	if exp, ok := claims["exp"].(float64); ok {
		if time.Now().UTC().Unix() > int64(exp) {
			return nil, fmt.Errorf("token expired")
		}
	}
	return claims, nil
}

func sign(secret []byte, msg string) []byte {
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(msg))
	return mac.Sum(nil)
}
