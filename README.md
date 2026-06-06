# Swing

A social messaging app where users send "paper plane" messages to random people based on filters (radius, country, gender, age). If the recipient accepts, they become connected and can chat. If they reject, the plane flies on to the next person with the same filters until it expires after 24 hours.

> The product name is a working title and may change before launch.

## Repository structure

```
swing/
├── client/              # React Native (Expo) app — iOS & Android
└── backend/
    └── serving/         # Main Go REST API (Neon Postgres) — may rename to eros
```

Each folder is self-contained with its own `package.json` and dependencies. They are deployed independently.

## Prerequisites

- Node.js 22 LTS (managed via `nvm`)
- pnpm 11+
- Expo Go app on your phone (App Store / Play Store)
- A Firebase project (added in a later phase)

## Running the client

```bash
cd client
pnpm install
pnpm start
```

Terminal should say **“Using Expo Go”** and the URL should look like `exp://192.168.x.x:8081` — **not** `exp+swing://expo-development-client`.

Scan with the **Camera** app on iPhone (tap “Open in Expo Go”), or with **Expo Go → Scan QR** on Android.

Laptop and phone must be on the **same WiFi** (or phone on laptop hotspot). If the app stays on “Opening project…” / “Loading…”, your IP may have changed — restart `pnpm start` and scan the **new** QR.

Tunnel fallback (if ngrok works on your network):

```bash
cd client
pnpm start:tunnel
```

## Running the backend (serving API)

```bash
cd backend/serving
cp config/setup/local/dev.local.yaml.example config/setup/local/dev.local.yaml
# Fill database.url (Neon) and auth.jwt_secret
go mod tidy
PROFILE=dev SETUP=local go run .
```

See `backend/serving/README.md` for layout and routes.

## Tech stack

**Client**

- Expo SDK 54 (React Native + TypeScript)
- `expo-router` for navigation

**Backend (`backend/serving`)**

- Go + chi router
- Neon Postgres
- JWT access + refresh tokens (email/password auth)
