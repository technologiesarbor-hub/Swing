package controllers

import (
	"fmt"

	"lib/stdid"
)

func stdidParsePath(raw string) (stdid.UUID, error) {
	id, err := stdid.Parse(raw)
	if err != nil {
		return stdid.UUID{}, fmt.Errorf("parse uuid: %w", err)
	}
	return id, nil
}
