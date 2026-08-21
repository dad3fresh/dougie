// Shared helpers for the serverless functions: GitHub JSON read/write,
// PIN check, image handling, and Vercel Blob upload.
const crypto = require('crypto');

const OWNER = process.env.GH_OWNER || 'dad3fresh';
const REPO = process.env.GH_REPO || 'dougie';
const BRANCH = process.env.GH_BRANCH || 'main';

function ghHeaders() {
  return {
    'Authorization': 'Bearer ' + process.env.GH_TOKEN,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'dougie-app',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}
function apiUrl(path) {
  return 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + path;
}

// Read a JSON file from the repo. Returns { sha, data } — data is null if the
// file doesn't exist yet (404).
async function ghGetJson(path) {
  const res = await fetch(apiUrl(path) + '?ref=' + encodeURIComponent(BRANCH), { headers: ghHeaders() });
  if (res.status === 404) return { sha: undefined, data: null };
  if (res.status !== 200) {
    const t = await res.text();
    throw new Error('GitHub read failed (' + res.status + '): ' + t.slice(0, 150));
  }
  const j = await res.json();
  let data = null;
  if (j.content) {
    try { data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')); } catch (e) { data = null; }
  }
  return { sha: j.sha, data };
}

// Write a JSON file to the repo (commit). Pass the sha from ghGetJson to update.
async function ghPutJson(path, obj, message, sha) {
  const body = {
    message: message,
    content: Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64'),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
    body: JSON.stringify(body)
  });
  if (res.status !== 200 && res.status !== 201) {
    const t = await res.text();
    throw new Error('GitHub write failed (' + res.status + '): ' + t.slice(0, 150));
  }
  return true;
}

// Constant-time PIN check against the CHECKIN_PIN env var (reused across the app).
function pinOk(pin) {
  const P = process.env.CHECKIN_PIN || '';
  if (!P) return false;
  const a = Buffer.from(String(pin || ''));
  const b = Buffer.from(String(P));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Parse a data:image/...;base64,... URL into { buffer, contentType, ext }.
// Rejects anything that isn't a jpeg/png/webp image, or that's too large.
const MAX_BYTES = 3 * 1024 * 1024; // 3MB after client-side downscale — generous
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
function decodeImage(dataUrl) {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!m) return { error: 'Not an image.' };
  const contentType = m[1].toLowerCase();
  const ext = TYPES[contentType];
  if (!ext) return { error: 'Use a JPEG, PNG, or WebP image.' };
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length) return { error: 'Empty image.' };
  if (buffer.length > MAX_BYTES) return { error: 'Image too large.' };
  return { buffer: buffer, contentType: contentType, ext: ext };
}

// Upload a buffer to Vercel Blob (public). Returns the public URL.
async function uploadBlob(pathname, buffer, contentType) {
  const { put } = await import('@vercel/blob');
  const res = await put(pathname, buffer, {
    access: 'public',
    contentType: contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true
  });
  return res.url;
}

module.exports = { ghGetJson, ghPutJson, pinOk, newId, decodeImage, uploadBlob };
