# Dougie Check-In app

A private, phone-friendly page at **`/checkin`** that you add to your home
screen like an app. Tap it, confirm the GPS-detected city, hit **Check In**, and
your public site updates — no laptop, no editing files.

How it works: the page POSTs to a serverless function (`api/checkin.js`), which
verifies your PIN and commits `location.json` to this repo via the GitHub API.
That triggers Vercel to redeploy, and the homepage shows the new location in
~30s.

```
phone  →  /checkin (PIN + GPS)  →  /api/checkin  →  commit location.json  →  Vercel redeploy  →  live
```

---

## One-time setup

### 1. A GitHub token (same kind as the Shortcut)

If you already made one for [SHORTCUT.md](SHORTCUT.md) you can reuse it.
Otherwise: github.com → **Settings → Developer settings → Fine-grained tokens →
Generate** → repository access: **only `dougie`** → permissions: **Contents →
Read and write**. Copy it.

### 2. Add environment variables in Vercel

Vercel project → **Settings → Environment Variables** → add (Production, and
Preview if you want it there too):

| Name | Value |
|------|-------|
| `CHECKIN_PIN` | a PIN you choose (**use 6+ digits** — see security note) |
| `GH_TOKEN` | the GitHub token from step 1 |

Optional overrides (defaults shown): `GH_OWNER` = `dad3fresh`, `GH_REPO` =
`dougie`, `GH_BRANCH` = `main`.

### 3. Redeploy

Env vars only apply to **new** deployments. Trigger one: Vercel → Deployments →
**Redeploy**, or push any commit.

### 4. Add it to your home screen

On your iPhone, open **`https://dougiewashere.com/checkin`** in Safari →
**Share → Add to Home Screen**. It installs as **Check-In** with the radar
icon and opens full-screen like an app.

---

## Using it

1. Tap the **Check-In** icon.
2. First time only: enter your PIN (remembered on the device afterward).
3. Tap **Use my current location** → allow location → it fills in your city
   (edit if you like).
4. Choose **LIVE** or **ON THE MOVE**.
5. (Optional) Set **Live badge text** — the words on the badge when you're LIVE
   (e.g. "LIVE IN DENVER"). It's prefilled with the current text; leave it as-is
   to keep it. The default lives in `content.js` (`config.liveLabel`).
6. Tap **Check In**. Your site updates in ~30s.

"Forget PIN on this device" clears the stored PIN (e.g. if you mistype it or
lend someone the phone).

---

## Test the function (after deploying)

Replace `YOUR_PIN`:

```bash
curl -sS -X POST https://dougiewashere.com/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"pin":"YOUR_PIN","city":"Test City, Nowhere","live":true}'
```

- `{"ok":true,...}` → working (it just checked you in — set it back from the app).
- `{"ok":false,"error":"Wrong PIN."}` → PIN mismatch with `CHECKIN_PIN`.
- `"Server not configured..."` → env vars missing or you haven't redeployed since adding them.

---

## Security notes

- The PIN is verified **server-side** (constant-time compare); the page never
  contains it. The GitHub token lives only in Vercel env vars, never in the
  browser.
- There's no rate limiting (that would need a database we're intentionally not
  adding), so **use a non-trivial PIN** — 6+ digits. Worst case if guessed:
  someone could change your displayed location. Rotate the PIN by editing
  `CHECKIN_PIN` in Vercel and redeploying.
- `/checkin` is marked `noindex` so search engines skip it, but treat the URL as
  semi-public — the PIN is the real lock.
