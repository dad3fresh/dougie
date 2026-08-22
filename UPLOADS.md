# Selfie uploads

Two ways photos get onto the site, both backed by **Vercel Blob** (image
storage) + the repo (metadata JSON committed by the functions, like the
check-in flow).

| Thing | Who | Page | Function | Data file |
|-------|-----|------|----------|-----------|
| **Post a Selfie** — your Daily Drop feed | You (PIN) | `/post` | `api/post.js` | `feed.json` |
| **Community upload** — Wall of Fame | Anyone | the site's "Upload It" button → `api/submit.js` | queued in `wall.json` |
| **Moderate** — approve/reject community photos | You (PIN) | `/moderate` | `api/moderate.js` | `wall.json` |

The homepage shows real `feed.json` posts in **Daily Drop** (falling back to the
`content.js` samples until you post), and **approved** `wall.json` photos on the
**Wall of Fame**. Images are downscaled on-device before upload (longest side
≤1600px, JPEG) so requests stay small and storage stays cheap.

---

## One-time setup

### 1. Add a Vercel Blob store
Vercel → your project → **Storage** tab → **Create Database → Blob** → name it
(anything) → **Create**, and connect it to the `dougie` project. This
automatically adds a **`BLOB_READ_WRITE_TOKEN`** environment variable.

### 2. Confirm the env vars
You already have `CHECKIN_PIN` and `GH_TOKEN` from the check-in setup — the
upload functions reuse them. After adding Blob you should have:

| Name | Purpose |
|------|---------|
| `CHECKIN_PIN` | PIN for `/post` and `/moderate` (same one as check-in) |
| `GH_TOKEN` | GitHub token, Contents read/write on `dougie` |
| `BLOB_READ_WRITE_TOKEN` | added automatically by the Blob store |
| `COMMUNITY_UPLOADS` | *optional* — set to `off` to close public uploads |

### 3. Redeploy
Vercel → **Deployments → Redeploy** (or push). The redeploy installs the new
`@vercel/blob` dependency and picks up the Blob token.

### 4. Add the apps to your phone
- **Post a Selfie:** open `https://dougiewashere.com/post` → Safari **Share →
  Add to Home Screen** (camera icon).
- **Moderate:** bookmark `https://dougiewashere.com/moderate` (or add to home
  screen too).

---

## Using it

**Post your own selfie:**
1. Open the **Post Selfie** app → enter PIN.
2. Choose the destination at the top: **Daily Drop** (your feed) or **Wall of
   Fame**. Your own wall posts are auto-approved — no moderation needed.
3. Tap the photo box → choose a photo → add a caption.
4. Optionally tap **Use my location** for the location tag and set the time
   label (defaults to "TODAY"). Both destinations support these.
5. **Post** → live on the site in ~30s.

The **Your recent posts** list below shows both your feed and wall photos
(tagged **FEED** / **WALL**), each with Edit and Delete — so you can manage
either from one place.

**Edit or delete a post:** the Post-a-Selfie app has a **Your recent posts**
list below the form. Each post has:
- **Edit** — change the caption / location / time in place (the photo stays),
  tap **Save**.
- **Delete** — removes the post from the feed **and** deletes the photo from
  Blob storage. To fix a bad photo: delete it and post again.

Both are PIN-gated (`/api/manage`) and go live in ~30s. (You can also edit
`feed.json` on GitHub by hand, but the app is safer — it can't break the JSON.)

**Community uploads (Wall of Fame):**
- Visitors tap **"Got a Photo With Me? Upload It"** on the site, add their photo
  + name + where you met, and submit. It goes to the **queue** (not shown yet).
- You open **`/moderate`**, review pending photos, and **Approve** (shows on the
  wall) or **Reject** (deleted from storage). Approved photos appear on the Wall
  of Fame within ~30s.

---

## Notes & safety

- **Community uploads are unauthenticated** (that's the point — anyone can
  submit). Protections: images are size/type-limited and never appear until you
  approve them. If you ever get spammed, set **`COMMUNITY_UPLOADS=off`** in
  Vercel (and redeploy) to close submissions, or add a captcha later.
- Each post/approval is a real git commit (your history doubles as a log) plus a
  ~30s redeploy — same trade-off as check-ins.
- Rejecting a photo deletes it from Blob storage. Approving just flips a flag in
  `wall.json`.
- The PIN for `/post` and `/moderate` is the **same** `CHECKIN_PIN`.
