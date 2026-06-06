# lib

Shared backend code (goserving `lib/` pattern). Application services import **`lib`** instead of random GitHub packages.

| Package | Purpose |
|---------|---------|
| `stdjwt` | HS256 JWT (`crypto/hmac`) |
| `stdid` | UUID v4 (`crypto/rand`) |
| `stdpasswd` | PBKDF2 password hashes (`crypto/pbkdf2`) |
| `stdcors` | CORS middleware (`net/http`) |
| `stdhttp` | Middleware chain + panic recovery |
| `pg` | Postgres via `database/sql` + `lib/pq` |

Only **lib/pq** is third-party; vendor or audit at this boundary.
