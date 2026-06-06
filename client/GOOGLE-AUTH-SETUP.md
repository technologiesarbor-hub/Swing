# Google Sign-In setup

Dev-only doc — users never see these steps. App shows short friendly errors only.

---

## iPhone in Expo Go (what you're using now)

Expo Go runs as **`host.exp.Exponent`**, not `com.rahulsaw.swing`. Your iOS OAuth client must match the app that is actually running.

### 1. OAuth consent screen (fixes "Access blocked")

1. [Google Cloud Console](https://console.cloud.google.com) → your project
2. **APIs & Services → OAuth consent screen**
3. User type: **External**, fill required fields
4. Status: **Testing**
5. **Test users → Add users** → the **exact Gmail** you pick on the iPhone sign-in sheet
6. Save and wait ~1 minute

If your Gmail is not listed, Google shows **Access blocked**.

### 2. OAuth clients for Expo Go

| Client | Type | Bundle / package | Env var |
|--------|------|------------------|---------|
| Web | Web application | — | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` + backend |
| iOS (Expo Go) | iOS | **`host.exp.Exponent`** | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Android (Expo Go) | Android | `host.exp.exponent` + debug SHA-1 | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |

**Account picker works, then "Google sign-in failed"** — almost always wrong iOS client for Expo Go.

Your `com.rahulsaw.swing` iOS client cannot finish login inside **Expo Go**. Create a **separate** client:

1. **Credentials → Create OAuth client → iOS**
2. Bundle ID: **`host.exp.Exponent`** (capital E)
3. Copy the **new** client ID (not the `com.rahulsaw.swing` one)
4. Paste into `client/.env` → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
5. Add same ID to `dev.local.yaml` → `google_client_ids`
6. **OAuth consent screen → Test users** → your Gmail
7. `pnpm start -- --clear`

The app uses redirect `host.exp.Exponent:/oauthredirect` in Expo Go.

Create the **iOS client for Expo Go** (not `com.rahulsaw.swing`):

1. **Credentials → Create OAuth client → iOS**
2. Bundle ID: **`host.exp.Exponent`** (capital E — copy exactly)
3. Paste the **new** client ID into `client/.env` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

Keep your `com.rahulsaw.swing` iOS client for later when you build a standalone/dev app — not for Expo Go.

### 3. `client/.env`

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=104091....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=EXPO_GO_HOST_EXP_EXPONENT_CLIENT_ID.apps.googleusercontent.com
```

### 4. Backend — allow both Web and iOS client IDs

iOS native sign-in puts the **iOS client ID** in the token `aud`, not the Web ID. In `dev.local.yaml`:

```yaml
auth:
  google_client_id: "<Web client ID>"
  google_client_ids:
    - "<Web client ID>"
    - "<Expo Go iOS client ID (host.exp.Exponent)>"
```

### 5. Restart

```bash
cd client && pnpm start -- --clear
```

Metro should log: `bundle: host.exp.Exponent redirect: host.exp.Exponent:/oauthredirect`

---

## Standalone / App Store build (later)

When you leave Expo Go, create (or reuse) an iOS client with bundle **`com.rahulsaw.swing`** and swap `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` to that value. Add it to backend `google_client_ids` too.

---

## Android (Expo Go)

1. Same **Test users** step as iPhone
2. **Android** OAuth client:
   - Package name: `host.exp.exponent`
   - SHA-1:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep SHA1
```

3. Add `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` to `.env` and the Android client ID to backend `google_client_ids`.

---

## User sees vs dev sees

| Situation | User sees | Dev sees (Metro console) |
|-----------|-----------|---------------------------|
| Not configured | Google sign-in is not available… | Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID… |
| Access blocked | Google sign-in was blocked… | access blocked — add Test users… |
| Wrong iOS bundle | Could not sign in with Google… | bundle / redirect mismatch in logs |
| Other failure | Could not sign in with Google… | raw OAuth detail |
