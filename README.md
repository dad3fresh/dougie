# Take a Selfie with Me — @dug3fresh

A mobile-first landing page / social funnel for a 60-day Southeast Asia travel
series. Single static page — no build step, no framework, no runtime network
calls. Edit, drag to a host, done.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page (HTML + CSS + JS, self-contained). You rarely touch this. |
| `content.js` | Feed, wall, QR target, and the **fallback** location/live status. |
| `location.json` | **Your daily location + live status** — rewritten by your phone shortcut (see below). |
| `vendor/qrcode.js` | Vendored MIT QR-code library (client-side QR, no external API). |
| `photos/` | Drop your real photos here (create the folder when you have some). |

## Updating content

Open **`content.js`** and edit the plain JS object:

- **Go live / not live** — `config.isLive: true` shows the pink "LIVE IN ASIA"
  badge; `false` shows the amber "ON THE MOVE" badge.
- **Change location** — `config.currentLocation: "Chiang Mai, Thailand"`.
- **Point the QR somewhere else** — `config.qrTarget`. The QR redraws itself
  from this value; nothing to regenerate.
- **Add a daily selfie** — copy the top block in `drops`, edit the fields, put
  it first (newest first). Set `image` to a photo path (`"photos/wat-arun.jpg"`)
  or a URL. Leave `image: ""` to show a labelled placeholder tile.
- **Add a community photo** — same idea in `wall`. `h` sets the tile height
  (px) for the masonry look.

No build, no reload gymnastics — save the file and refresh the page.

## Updating your location (daily)

Location and live status live in **`location.json`**, separate from the rest so
you can change them safely from your phone:

```json
{ "city": "Chiang Mai, Thailand", "live": true, "updated": "2026-08-21" }
```

The page fetches this on load and it overrides the fallback in `content.js`.
`live: true` shows the pink "LIVE IN ASIA" badge; `false` shows amber "ON THE
MOVE". `updated` is just for your own reference.

Two ways to change it:

1. **From github.com on your phone** — open `location.json`, tap the pencil,
   edit the city, commit. Vercel auto-deploys in ~30s.
2. **One-tap phone shortcut** (recommended) — a shortcut that rewrites
   `location.json` via the GitHub API so you never open a browser. It makes two
   GitHub API calls: `GET` the file (to read its current `sha`), then `PUT` the
   new content (base64-encoded) with that `sha`. Needs a fine-grained GitHub
   Personal Access Token scoped to **only this repo** with **Contents:
   read/write**. Keep the token inside the shortcut — never commit it.

## Running locally

Any static server works (needed so the browser can load `content.js` /
`vendor/qrcode.js` — opening `index.html` via `file://` also works in most
browsers, but a server is closer to production):

```bash
python -m http.server 4178
```

Then open http://localhost:4178.

## Deploying

It's static files, so drop the folder on any static host:

- **Netlify / Cloudflare Pages** — drag the folder into the dashboard, or
  connect the repo. No build command; publish directory is the folder root.
- **GitHub Pages** — push and enable Pages on the branch.
- **Vercel** — import as a static project (no framework preset).

## Still to wire up (was UI-only in the design)

- **Upload submissions.** The "Upload Your Selfie" modal shows a success state
  but stores nothing. To make it real, POST the photo + name + location to an
  endpoint / storage bucket, and ideally have the Wall of Fame read approved
  submissions from there instead of `content.js`.

## Notes / credits

- Fonts (Anton, Space Grotesk) load from Google Fonts; the page falls back to
  system fonts if offline.
- Brand icons are inline SVG (Simple Icons paths); UI icons are inline
  Lucide-style SVG. No icon CDN.
- QR generation: `qrcode-generator` by Kazuhiko Arase (MIT).
