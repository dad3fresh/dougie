# Take a Selfie with Me — @dug3fresh

A mobile-first landing page / social funnel for a 60-day Southeast Asia travel
series. Single static page — no build step, no framework, no runtime network
calls. Edit, drag to a host, done.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page (HTML + CSS + JS, self-contained). You rarely touch this. |
| `content.js` | **The file you edit as the trip goes on** — feed, wall, location, live status, links. |
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
