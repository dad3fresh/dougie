// POST /api/submit — a community selfie (public, no PIN). Lands in the
// moderation queue (approved:false) until you approve it via /moderate.
// Body: { name, where, image (data URL) }
const { ghGetJson, ghPutJson, newId, decodeImage, uploadBlob } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  // Off-switch: set env COMMUNITY_UPLOADS=off in Vercel to close public uploads.
  if ((process.env.COMMUNITY_UPLOADS || 'on').toLowerCase() === 'off') {
    return res.status(403).json({ ok: false, error: 'Community uploads are closed right now.' });
  }
  if (!process.env.GH_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Uploads are not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const name = (body.name || '').toString().trim().slice(0, 40);
  const where = (body.where || '').toString().trim().slice(0, 60);

  const img = decodeImage(body.image);
  if (img.error) return res.status(400).json({ ok: false, error: img.error });

  const caption = [name || 'Someone', where].filter(Boolean).join(', ');

  try {
    const url = await uploadBlob('wall/' + newId() + '.' + img.ext, img.buffer, img.contentType);
    const entry = { id: newId(), caption: caption, image: url, approved: false, ts: Date.now() };
    const { sha, data } = await ghGetJson('wall.json');
    const list = Array.isArray(data) ? data : [];
    const next = [entry].concat(list).slice(0, 500);
    await ghPutJson('wall.json', next, 'Community submission (pending)', sha);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Upload failed', detail: String(e.message || e).slice(0, 200) });
  }
};
