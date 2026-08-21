// POST /api/moderate — approve or reject a pending community photo (PIN-gated).
// Body: { pin, id, action: 'approve' | 'reject' }
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
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return res.status(400).json({ ok: false, error: 'Bad request.' });
  }

  try {
    const { sha, data } = await ghGetJson('wall.json');
    const list = Array.isArray(data) ? data : [];
    const item = list.find(function (x) { return x && x.id === id; });
    if (!item) return res.status(404).json({ ok: false, error: 'Not found (already handled?).' });

    let next;
    if (action === 'approve') {
      item.approved = true;
      next = list;
    } else {
      next = list.filter(function (x) { return x && x.id !== id; });
      // Best-effort delete of the rejected blob so it doesn't linger in storage.
      try {
        if (item.image && process.env.BLOB_READ_WRITE_TOKEN) {
          const { del } = await import('@vercel/blob');
          await del(item.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      } catch (e) { /* ignore — the metadata removal is what matters */ }
    }
    await ghPutJson('wall.json', next, (action === 'approve' ? 'Approve' : 'Reject') + ' community photo', sha);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Moderation failed', detail: String(e.message || e).slice(0, 200) });
  }
};
