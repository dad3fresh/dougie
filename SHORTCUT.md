# One-tap location update (iOS Shortcut)

Update your daily location from your iPhone with a single tap — no laptop, no
browser. The shortcut rewrites [`location.json`](location.json) in this repo via
the GitHub API, and Vercel auto-deploys the change in ~20–30s.

How it works: it makes two GitHub API calls — a **GET** to read the file's
current `sha`, then a **PUT** to write the new contents (base64-encoded) back
with that `sha`.

---

## One-time setup: a scoped GitHub token

1. On github.com: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.**
2. **Repository access:** Only select repositories → `dougie`.
3. **Permissions:** Repository permissions → **Contents → Read and write**
   (leave everything else "No access").
4. Set an expiration (e.g. 90 days — covers the trip), generate, and **copy the
   token.**

> **Keep the token inside the Shortcut on your phone only.** Never commit it to
> this repo or paste it anywhere shared. A fine-grained token scoped to just
> this repo's Contents is the least-privilege option — if it ever leaks, the
> worst case is edits to this one repo.

---

## Build the shortcut

Open the **Shortcuts** app → **+** (new shortcut) → add these actions in order.
Replace **`OWNER`** with your GitHub username and **`YOUR_TOKEN`** with the token
from setup.

| # | Action | Settings |
|---|--------|----------|
| 1 | **Get Current Location** | — |
| 2 | **Get Details of Locations** | Detail: **City** · rename result → `CityName` |
| 3 | **Get Details of Locations** | Detail: **Country** · rename result → `CountryName` |
| 4 | **Text** | `CityName, CountryName` (insert both variables, comma-space between) |
| 5 | **Ask for Input** | Type: **Text** · Prompt: `Confirm your location` · **Default Value:** the Text from step 4 · rename result → `Location` |
| 6 | **Choose from Menu** *(optional live toggle)* | Two items: **LIVE IN ASIA** → add **Text** `true`; **ON THE MOVE** → add **Text** `false`. Rename result → `LiveFlag` |
| 7 | **Format Date** (Current Date) | Format: `yyyy-MM-dd` · rename result → `Today` |
| 8 | **Text** (new file contents) | `{"city":"Location","live":LiveFlag,"updated":"Today"}` — insert `Location`, `LiveFlag`, `Today` as variables |
| 9 | **Base64 Encode** | Encode the Text from step 8 · **Line Breaks: None** · rename result → `ContentB64` |
| 10 | **Get Contents of URL** — the **GET** | see below |
| 11 | **Get Dictionary Value** | Get value for key **`sha`** from step 10's result · rename result → `Sha` |
| 12 | **Get Contents of URL** — the **PUT** | see below |
| 13 | **Show Notification** | `Updated to Location — deploying…` |

**Skipping the live toggle?** Leave out step 6 and just type `true` literally in
place of `LiveFlag` in step 8.

### Step 10 — GET (read current sha)

- **URL:** `https://api.github.com/repos/OWNER/dougie/contents/location.json`
- **Method:** `GET`
- **Headers:**
  - `Authorization` = `Bearer YOUR_TOKEN`
  - `Accept` = `application/vnd.github+json`

### Step 12 — PUT (write new contents)

- **URL:** same contents URL as step 10
- **Method:** `PUT`
- **Headers:**
  - `Authorization` = `Bearer YOUR_TOKEN`
  - `Accept` = `application/vnd.github+json`
- **Request Body:** `JSON`, with three fields:
  - `message` (Text) → `Update location: Location`
  - `content` (Text) → `ContentB64`
  - `sha` (Text) → `Sha`

Finally, **Add to Home Screen** (or assign to Back Tap / a widget) so it's a
genuine one-tap update.

---

## Test it

1. Tap the shortcut → confirm the GPS-detected city → let it run.
2. On github.com, `location.json` should show the new city and a fresh commit.
3. Vercel auto-deploys (~20–30s). Reload your live site — the hero location and
   badge update (the page fetches `location.json` fresh, no caching).

---

## Gotchas

- **Order matters:** the `sha` from the GET (step 11) must feed the PUT (step
  12). GitHub rejects a file update without the current `sha`.
- **Straight quotes only:** the JSON in step 8 breaks if iOS substitutes smart
  quotes — type plain `"`.
- **Base64 line breaks:** set to **None** in step 9.
- **Repo visibility doesn't matter:** your Vercel site serves `location.json`
  publicly even if the GitHub repo is private.
- **Token expired?** Regenerate it in GitHub and update the two `Authorization`
  headers in the shortcut.

---

## The data file

The shortcut writes this shape to [`location.json`](location.json):

```json
{ "city": "Chiang Mai, Thailand", "live": true, "updated": "2026-08-21" }
```

- `city` — shown in the hero location chip.
- `live` — `true` → pink "LIVE IN ASIA" badge; `false` → amber "ON THE MOVE".
- `updated` — for your own reference; the page ignores it.

If `location.json` is ever missing or unreachable, the page falls back to
`config.currentLocation` / `config.isLive` in [`content.js`](content.js).
