package status

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"lib/stdid"
)

const statusLifetime = 24 * time.Hour

var (
	ErrNotFound     = errors.New("status not found")
	ErrInvalidInput = errors.New("invalid input")
)

type Item struct {
	ID          stdid.UUID `json:"id"`
	AccountID   stdid.UUID `json:"accountId"`
	Kind        string     `json:"kind"`
	MediaKey    string     `json:"mediaKey"`
	ContentType string     `json:"contentType"`
	ViewURL     string     `json:"viewUrl,omitempty"`
	PostedAt    time.Time  `json:"postedAt"`
	ExpiresAt   time.Time  `json:"expiresAt"`
}

type CreateInput struct {
	MediaKey    string
	ContentType string
	Kind        string
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func kindFromContentType(ct string) string {
	if strings.HasPrefix(ct, "video/") {
		return "video"
	}
	return "image"
}

func (s *Service) ListMine(ctx context.Context, accountID stdid.UUID) ([]Item, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, account_id, kind, media_key, content_type, posted_at, expires_at
		FROM status_items
		WHERE account_id = $1 AND expires_at > NOW()
		ORDER BY posted_at ASC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var out []Item
	for rows.Next() {
		var it Item
		if err := rows.Scan(
			&it.ID, &it.AccountID, &it.Kind, &it.MediaKey,
			&it.ContentType, &it.PostedAt, &it.ExpiresAt,
		); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (s *Service) ListForAccount(ctx context.Context, accountID stdid.UUID) ([]Item, error) {
	return s.ListMine(ctx, accountID)
}

func (s *Service) Create(ctx context.Context, accountID stdid.UUID, in CreateInput) (Item, error) {
	mediaKey := strings.TrimSpace(in.MediaKey)
	if mediaKey == "" {
		return Item{}, ErrInvalidInput
	}
	ct := strings.TrimSpace(in.ContentType)
	if ct == "" {
		return Item{}, ErrInvalidInput
	}
	kind := strings.TrimSpace(in.Kind)
	if kind == "" {
		kind = kindFromContentType(ct)
	}
	if kind != "image" && kind != "video" {
		return Item{}, ErrInvalidInput
	}
	if !strings.HasPrefix(mediaKey, "status/"+accountID.String()+"/") {
		return Item{}, ErrInvalidInput
	}

	id, err := stdid.New()
	if err != nil {
		return Item{}, err
	}
	now := time.Now().UTC()
	expires := now.Add(statusLifetime)

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO status_items (id, account_id, kind, media_key, content_type, posted_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, id, accountID, kind, mediaKey, ct, now, expires)
	if err != nil {
		return Item{}, err
	}

	return Item{
		ID:          id,
		AccountID:   accountID,
		Kind:        kind,
		MediaKey:    mediaKey,
		ContentType: ct,
		PostedAt:    now,
		ExpiresAt:   expires,
	}, nil
}

func (s *Service) Delete(ctx context.Context, accountID, itemID stdid.UUID) error {
	res, err := s.db.ExecContext(ctx, `
		DELETE FROM status_items WHERE id = $1 AND account_id = $2
	`, itemID, accountID)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
