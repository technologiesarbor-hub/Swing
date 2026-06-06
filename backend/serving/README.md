# Serving API

Main Swing REST service. Layout matches **goserving**; dependencies follow `backend/PACKAGES.md`.

## Dependencies

| Layer | Packages |
|-------|----------|
| **serving** | `stdlib` + **`lib`** + **`gopkg.in/yaml.v3`** (config — same as goserving) |
| **lib** | `stdlib` + **`github.com/lib/pq`** (Postgres driver — single audited infra dep) |

No chi, jwt, pgx, cors, bcrypt, or google/uuid in application code.

## Layout

```
serving/
├── main.go
├── web/          web.go, routes/, controllers/, middlewares/
├── app/cmd/      auth/, common/
├── app/pkg/      httpx/
├── config/       setup/local/*.yaml (embedded) + dev.local.yaml
└── build/
```

## IntelliJ / GoLand

Run configs in `.idea/runConfigurations/` (goserving pattern — `!.idea/runConfigurations` in `.gitignore`).

1. Open **`swing/`** repo root (or **`swingmain/`** if nested — configs use `swing/backend/serving` paths).
2. **Go** plugin enabled.
3. Run dropdown → **`[Serving] local dev`** → Run ▶ or Debug 🐛.
4. Needs `config/setup/local/dev.local.yaml` with Neon URL + JWT.

Stop terminal `go run .` if port 8080 is busy.

## Run locally

```bash
source scripts/env-go.sh   # if go not on PATH
cd backend/serving
cp config/setup/local/dev.local.yaml.example config/setup/local/dev.local.yaml
# Real Neon database.url + auth.jwt_secret

PROFILE=dev SETUP=local go run .
```

Env overrides: `DATABASE_URL`, `JWT_SECRET`, `PORT`.

## Config

Embedded `config/setup/{SETUP}/{PROFILE}.yaml` (goserving-style). Secrets in gitignored `dev.local.yaml`.
