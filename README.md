# Swing

A social messaging app where users send "paper plane" messages to random people based on filters (radius, country, gender, age). If the recipient accepts, they become connected and can chat. If they reject, the plane flies on to the next person with the same filters until it expires after 24 hours.

> The product name is a working title and may change before launch.

## Repository structure

```
swing/
├── client/   # React Native (Expo) app — iOS & Android
└── server/   # Backend (Firebase Cloud Functions) — coming soon
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

Scan the QR code with the Camera app on iPhone, or with Expo Go on Android.

Laptop and phone must be on the **same WiFi**. If they're on different networks, run `pnpm start --tunnel` instead.

## Running the server

Not implemented yet. Will be added during the auth & backend phase.

## Tech stack

**Client**

- Expo SDK 54 (React Native + TypeScript)
- `expo-router` for navigation
- Firebase JS SDK for auth, Firestore, push notifications

**Server**

- Firebase Authentication (phone OTP)
- Firestore (users, planes, chats)
- Cloud Functions (Node.js) for matching & moderation
- Firebase Cloud Messaging (push notifications)
