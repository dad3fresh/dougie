// POST /api/manage — edit or delete one of your Daily Drop posts (PIN-gated).
// Body:
//   { pin, id, action: 'delete' }
//   { pin, id, action: 'edit', caption, location?, time? }
const { ghGetJson, ghPutJson, pinOk } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  if (!process.env.CHECKIN_PIN || !process.env.GH_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Server not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (!pinOk(body.pin)) return res.status(401).json({ ok: false, error: 'Wrong PIN.' });

  const id = (body.id || '').toString();
  const action = (body.action || '').toString();
  const which = (body.list === 'wall') ? 'wall' : 'feed';
  const file = which === 'wall' ? 'wall.json' : 'feed.json';
  if (!id || (action !== 'delete' && action !== 'edit')) {
    return res.status(400).json({ ok: false, error: 'Bad request.' });
  }

  try {
    const { sha, data } = await ghGetJson(file);
    const list = Array.isArray(data) ? data : [];
    const item = list.find(function (x) { return x && x.id === id; });
    if (!item) return res.status(404).json({ ok: false, error: 'Post not found (already changed?).' });

    let next, message;
    if (action === 'delete') {
      next = list.filter(function (x) { return x && x.id !== id; });
      message = 'Delete ' + which + ' photo: ' + (item.caption || id);
      // Best-effort delete of the photo from Blob storage.
      try {
        if (item.image && process.env.BLOB_READ_WRITE_TOKEN) {
          const { del } = await import('@vercel/blob');
          await del(item.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      } catch (e) { /* metadata removal is what matters */ }
    } else {
      const caption = (body.caption || '').toString().trim().slice(0, 140);
      if (!caption) return res.status(400).json({ ok: false, error: 'Caption cannot be empty.' });
      item.caption = caption;
      // Location/time only apply to feed posts (the wall has neither).
      if (which === 'feed') {
        if (typeof body.location === 'string') item.location = body.location.trim().slice(0, 40).toUpperCase();
        if (typeof body.time === 'string') item.time = (body.time.trim().slice(0, 24) || 'TODAY').toUpperCase();
      }
      next = list;
      message = 'Edit ' + which + ' photo: ' + caption;
    }
    await ghPutJson(file, next, message, sha);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Update failed', detail: String(e.message || e).slice(0, 200) });
  }
};
