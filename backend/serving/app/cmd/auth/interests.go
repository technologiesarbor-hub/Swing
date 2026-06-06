package auth

import (
	"strings"
)

const maxInterestTags = 8

// NormalizeInterests stores tags as a lowercase, comma-separated string.
func NormalizeInterests(raw string) string {
	if strings.TrimSpace(raw) == "" {
		return ""
	}
	seen := make(map[string]struct{})
	var out []string
	for _, part := range strings.Split(raw, ",") {
		tag := strings.TrimSpace(strings.ToLower(part))
		if tag == "" {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		out = append(out, tag)
		if len(out) >= maxInterestTags {
			break
		}
	}
	return strings.Join(out, ",")
}
