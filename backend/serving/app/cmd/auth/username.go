package auth

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrUsernameInvalid  = errors.New("username invalid")
	ErrUsernameTaken    = errors.New("username taken")
	ErrUsernameReserved = errors.New("username reserved")
)

var usernamePattern = regexp.MustCompile(`^[a-z0-9_]+$`)

var reservedUsernames = map[string]struct{}{
	"admin": {}, "administrator": {}, "swing": {}, "official": {},
	"support": {}, "help": {}, "team": {}, "mod": {}, "moderator": {},
	"staff": {}, "root": {}, "system": {}, "security": {},
	"paperplane": {}, "paper_plane": {},
}

func NormalizeUsername(input string) string {
	return strings.TrimSpace(strings.ToLower(input))
}

func ValidateUsername(input string) error {
	v := NormalizeUsername(input)
	if len(v) == 0 {
		return ErrUsernameInvalid
	}
	if len(v) < 3 || len(v) > 20 {
		return ErrUsernameInvalid
	}
	if !usernamePattern.MatchString(v) {
		return ErrUsernameInvalid
	}
	if strings.HasPrefix(v, "_") || strings.HasSuffix(v, "_") {
		return ErrUsernameInvalid
	}
	if strings.Contains(v, "__") {
		return ErrUsernameInvalid
	}
	if _, ok := reservedUsernames[v]; ok {
		return ErrUsernameReserved
	}
	return nil
}
