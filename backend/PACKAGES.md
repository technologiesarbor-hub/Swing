# Backend dependency policy (goserving-aligned)

Companies rarely pull random `github.com/*` packages into application code. Swing follows the same tiers as **goserving**:

| Tier | Source | Use for |
|------|--------|---------|
| **0** | Go **standard library** (`net/http`, `encoding/json`, `crypto/*`, `database/sql`, …) | Default — HTTP, JWT (HMAC), passwords (PBKDF2), IDs |
| **1** | **`backend/lib`** | Shared code we own; any unavoidable infra (e.g. Postgres wire driver) lives **here only**, not in `serving/` |
| **2** | **`vendor/`** (optional) | After security review, run `go mod vendor` and commit — no runtime fetch from the internet |
| **Avoid** | Direct `github.com/*` in `serving/` | Routers (chi), JWT libs, CORS libs, etc. — use stdlib + `lib` instead |

**goserving reference:** `clicktransfer` depends on internal `lib`, `cmpkg`, `connections` and only allowlisted extras (`gopkg.in/yaml.v3`, `github.com/google/uuid`). Swing **serving** uses the same **`gopkg.in/yaml.v3`** for config (embedded `setup/`) plus **`lib`** for Postgres — no chi, no jwt/v5, no pgx in application module.

**Postgres note:** There is no stdlib Postgres client. The supported pattern is one audited driver inside `backend/lib/pg` (same idea as goserving’s DB connectors under `connections/`).
