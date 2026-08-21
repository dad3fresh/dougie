// POST /api/post — your own selfie into the Daily Drop feed (PIN-gated).
// Body: { pin, caption, location, time?, image (data URL) }
// Uploads the image to Vercel Blob, then commits feed.json in the repo.
const { ghGetJson, ghPutJson, pinOk, newId, decodeImage, uploadBlob } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  if (!process.env.CHECKIN_PIN || !process.env.GH_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Server not configured (need CHECKIN_PIN, GH_TOKEN, BLOB_READ_WRITE_TOKEN).' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (!pinOk(body.pin)) return res.status(401).json({ ok: false, error: 'Wrong PIN.' });

  const caption = (body.caption || '').toString().trim().slice(0, 140);
  const location = (body.location || '').toString().trim().slice(0, 40);
  const time = (body.time || 'TODAY').toString().trim().slice(0, 24) || 'TODAY';
  if (!caption) return res.status(400).json({ ok: false, error: 'Add a caption.' });

  const img = decodeImage(body.image);
  if (img.error) return res.status(400).json({ ok: false, error: img.error });

  try {
    const url = await uploadBlob('feed/' + newId() + '.' + img.ext, img.buffer, img.contentType);
    const entry = {
      id: newId(),
      time: time.toUpperCase(),
      location: location.toUpperCase(),
      caption: caption,
      image: url,
      ts: Date.now()
    };
    const { sha, data } = await ghGetJson('feed.json');
    const list = Array.isArray(data) ? data : [];
    const next = [entry].concat(list).slice(0, 60); // newest first, cap 60
    await ghPutJson('feed.json', next, 'New selfie: ' + caption, sha);
    return res.status(200).json({ ok: true, url: url });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Upload failed', detail: String(e.message || e).slice(0, 200) });
  }
};
