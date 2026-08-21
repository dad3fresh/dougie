// Vercel serverless function — POST /api/checkin
// Verifies your PIN, then commits location.json to GitHub (Contents API),
// which triggers Vercel to redeploy with the new location.
//
// Set these in Vercel → Settings → Environment Variables:
//   CHECKIN_PIN  (required)  the PIN you type in the app
//   GH_TOKEN     (required)  fine-grained GitHub PAT, Contents: read/write on the repo
//   GH_OWNER     (optional)  default 'dad3fresh'
//   GH_REPO      (optional)  default 'dougie'
//   GH_BRANCH    (optional)  default 'main'

const crypto = require('crypto');

// Constant-time compare so the PIN can't be guessed by timing the response.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const PIN = process.env.CHECKIN_PIN;
  const TOKEN = process.env.GH_TOKEN;
  if (!PIN || !TOKEN) {
    return res.status(500).json({ ok: false, error: 'Server not configured (missing CHECKIN_PIN or GH_TOKEN).' });
  }

  // Vercel usually parses JSON bodies, but be defensive about strings.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const pin = body.pin;
  const city = (body.city || '').toString().trim();
  const live = body.live === true || body.live === 'true';

  if (!safeEqual(pin, PIN)) {
    return res.status(401).json({ ok: false, error: 'Wrong PIN.' });
  }
  if (!city) {
    return res.status(400).json({ ok: false, error: 'City is required.' });
  }
  if (city.length > 80) {
    return res.status(400).json({ ok: false, error: 'City is too long.' });
  }

  const owner = process.env.GH_OWNER || 'dad3fresh';
  const repo = process.env.GH_REPO || 'dougie';
  const branch = process.env.GH_BRANCH || 'main';
  const path = 'location.json';
  const api = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
  const ghHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'dougie-checkin',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const newContent = JSON.stringify({ city: city, live: live, updated: today }, null, 2) + '\n';

  try {
    // 1) read current file to get its sha (required to update an existing file)
    let sha;
    const getRes = await fetch(api + '?ref=' + encodeURIComponent(branch), { headers: ghHeaders });
    if (getRes.status === 200) {
      const j = await getRes.json();
      sha = j.sha;
    } else if (getRes.status !== 404) {
      const t = await getRes.text();
      return res.status(502).json({ ok: false, error: 'GitHub read failed', detail: t.slice(0, 200) });
    }

    // 2) write the new contents
    const putBody = {
      message: 'Check in: ' + city + (live ? ' (live)' : ''),
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      branch: branch
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(api, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders),
      body: JSON.stringify(putBody)
    });

    if (putRes.status === 200 || putRes.status === 201) {
      return res.status(200).json({ ok: true, city: city, live: live });
    }
    const t = await putRes.text();
    return res.status(502).json({ ok: false, error: 'GitHub write failed', detail: t.slice(0, 200) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Unexpected error', detail: String(e).slice(0, 200) });
  }
};
