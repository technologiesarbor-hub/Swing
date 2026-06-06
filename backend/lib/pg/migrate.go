package pg

import (
	"context"
	"database/sql"
	"fmt"
)

// prepareForSchema drops legacy refresh_tokens (user_id column) so schema.sql
// can create refresh_tokens with account_id.
func prepareForSchema(ctx context.Context, db *sql.DB) error {
	var hasLegacyRefresh bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_schema = 'public'
			  AND table_name = 'refresh_tokens'
			  AND column_name = 'user_id'
		)
	`).Scan(&hasLegacyRefresh)
	if err != nil {
		return fmt.Errorf("check legacy refresh_tokens: %w", err)
	}
	if hasLegacyRefresh {
		if _, err := db.ExecContext(ctx, `DROP TABLE IF EXISTS refresh_tokens CASCADE`); err != nil {
			return fmt.Errorf("drop legacy refresh_tokens: %w", err)
		}
	}
	return nil
}

// migrateProfileColumns adds columns introduced after the initial profiles table.
func migrateProfileColumns(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, `
		ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT NOT NULL DEFAULT ''
	`); err != nil {
		return fmt.Errorf("add profiles.interests: %w", err)
	}
	return nil
}

func migrateStatusItems(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS status_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
			media_key TEXT NOT NULL,
			content_type TEXT NOT NULL,
			posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("status_items table: %w", err)
	}
	if _, err := db.ExecContext(ctx, `
		CREATE INDEX IF NOT EXISTS idx_status_items_account_expires
			ON status_items(account_id, expires_at)
	`); err != nil {
		return fmt.Errorf("status_items index: %w", err)
	}
	return nil
}

// migrateFromLegacyUsers moves data from the old single-table `users` schema
// into accounts + profiles, then drops legacy tables.
func migrateFromLegacyUsers(ctx context.Context, db *sql.DB) error {
	var usersExists bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'users'
		)
	`).Scan(&usersExists)
	if err != nil {
		return fmt.Errorf("check legacy users: %w", err)
	}
	if !usersExists {
		return nil
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO accounts (id, email, password_hash, created_at, updated_at)
		SELECT id, email, password_hash, created_at, updated_at
		FROM users
		ON CONFLICT (id) DO NOTHING
	`); err != nil {
		return fmt.Errorf("migrate accounts: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO profiles (account_id, profile_complete, created_at, updated_at)
		SELECT id, profile_complete, created_at, updated_at
		FROM users
		ON CONFLICT (account_id) DO NOTHING
	`); err != nil {
		return fmt.Errorf("migrate profiles: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `DROP TABLE IF EXISTS refresh_tokens CASCADE`); err != nil {
		return fmt.Errorf("drop legacy refresh_tokens: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `DROP TABLE IF EXISTS users CASCADE`); err != nil {
		return fmt.Errorf("drop legacy users: %w", err)
	}

	return tx.Commit()
}
