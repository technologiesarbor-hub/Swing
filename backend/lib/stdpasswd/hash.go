package stdpasswd

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

const (
	iterations = 120_000
	saltLen    = 16
	keyLen     = 32
)

// Hash returns "sha256kdf$iter$salt$hash" (stdlib only).
func Hash(password string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	dk := derive(password, salt, iterations, keyLen)
	return fmt.Sprintf("sha256kdf$%d$%s$%s",
		iterations,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(dk),
	), nil
}

// Compare verifies a password against Hash output.
func Compare(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 || parts[0] != "sha256kdf" {
		return false
	}
	iter, err := strconv.Atoi(parts[1])
	if err != nil {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}
	want, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	got := derive(password, salt, iter, len(want))
	return subtle.ConstantTimeCompare(got, want) == 1
}

func derive(password string, salt []byte, iter, keyLen int) []byte {
	buf := make([]byte, 0, len(salt)+len(password))
	buf = append(buf, salt...)
	buf = append(buf, password...)
	h := sha256.Sum256(buf)
	out := h[:]
	for i := 1; i < iter; i++ {
		h = sha256.Sum256(out)
		out = h[:]
	}
	if len(out) >= keyLen {
		return out[:keyLen]
	}
	return out
}
