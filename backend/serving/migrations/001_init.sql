-- Reference schema (applied from lib/pg/schema.sql on startup).

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    password_hash TEXT,
    google_sub TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT accounts_email_unique UNIQUE (email),
    CONSTRAINT accounts_google_sub_unique UNIQUE (google_sub),
    CONSTRAINT accounts_has_credential CHECK (
        password_hash IS NOT NULL OR google_sub IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS profiles (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    username TEXT,
    name TEXT,
    dob DATE,
    gender TEXT,
    bio TEXT NOT NULL DEFAULT '',
    city TEXT,
    country TEXT,
    avatar_url TEXT,
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_username_unique UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_account_id ON refresh_tokens(account_id);
