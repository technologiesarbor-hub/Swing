# Media storage — Cloudflare R2

Swing stores all media in **one R2 bucket** with folder prefixes:

| Folder | Use | Access |
|--------|-----|--------|
| `avatars/` | Profile photos | Public URL |
| `status/` | 24h status slides | Private — presigned view URLs |
| `chat/` | Chat images & voice | Private — presigned view URLs |

Postgres only stores metadata and keys — never raw files.

## 1. Create R2 bucket

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → **Create bucket**
   - Name: e.g. `swing-media`
2. **Public access** → enable **R2.dev subdomain** for avatars
   - Copy URL: `https://pub-xxxxxxxx.r2.dev` (no trailing slash)
3. **Manage R2 API tokens** → Create token (Object Read & Write on bucket)

## 2. Configure Go API

Add to `backend/serving/config/setup/local/dev.local.yaml`:

```yaml
r2:
  account_id: "YOUR_CLOUDFLARE_ACCOUNT_ID"
  access_key_id: "YOUR_R2_ACCESS_KEY_ID"
  secret_access_key: "YOUR_R2_SECRET_ACCESS_KEY"
  bucket: "swing-media"
  public_base_url: "https://pub-xxxxxxxx.r2.dev"
```

Restart server — log: `r2 media storage enabled (bucket=swing-media)`

## 3. API endpoints

### Avatars (public)
- `POST /v1/me/avatar/upload-url` → PUT to R2 → `PATCH /v1/me { avatarUrl }`

### Status (private, 24h)
- `POST /v1/me/status/upload-url`
- `POST /v1/me/status` `{ mediaKey, contentType, kind }`
- `GET /v1/me/status` — your slides with presigned `viewUrl`
- `GET /v1/status/{accountId}` — view someone else's active status
- `DELETE /v1/me/status/{id}`

### Chat media (private)
- `POST /v1/media/chat/upload-url` `{ chatId, contentType }`
- `POST /v1/media/read-url` `{ mediaKey }` → short-lived `viewUrl`

## 4. Client flows (already wired)

| Screen | Behaviour |
|--------|-----------|
| Profile / Edit | Pick photo → upload avatar → save URL |
| Status | Upload drafts → R2 + API; remove calls DELETE |
| Chat | Send image/voice → upload to `chat/` then send with `mediaKey` |

Without R2 config, uploads show: *"Media upload is not configured on the server."*

## 5. Cost

R2 free tier (~10 GB) covers MVP for 6+ months if client compresses media.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `STORAGE_NOT_CONFIGURED` | Add `r2:` to `dev.local.yaml`, restart Go |
| PUT fails 403 | Check API token + bucket name |
| Avatar 404 | Enable public access on bucket / R2.dev URL |
| Status/chat won't play | Call `POST /v1/media/read-url` — URLs expire after ~1 hour |
