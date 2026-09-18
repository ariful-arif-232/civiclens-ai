import { createHash } from 'node:crypto';
const REPORT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function cloudinaryConfig(env = process.env) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME, apiKey = env.CLOUDINARY_API_KEY, apiSecret = env.CLOUDINARY_API_SECRET;
  if (!cloudName || !/^[A-Za-z0-9_-]+$/.test(cloudName) || !apiKey || !apiSecret)
    throw new Error('Cloudinary server configuration is incomplete.');
  return { cloudName, apiKey, apiSecret };
}
export function cloudinarySignature(params, secret) {
  const text = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return createHash('sha256').update(text + secret).digest('hex');
}
function basicAuth(config) {
  return `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`, 'utf8').toString('base64')}`;
}
export function reportImageId(id) {
  if (!REPORT_ID.test(id)) throw new Error('Invalid report image identifier.');
  return `civiclens-ai/reports/${id}`;
}
export function isReportImageUrl(url, cloudName, publicId) {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' &&
      !u.username && !u.password && !u.search && !u.hash &&
      new RegExp(`^/${cloudName}/image/upload/v[0-9]+/${publicId}\\.webp$`).test(u.pathname);
  } catch { return false; }
}
export async function uploadImage(id, bytes, config, fetcher = fetch) {
  const publicId = reportImageId(id);
  const body = new FormData();
  body.set('public_id', publicId);
  body.set('overwrite', 'false');
  body.set('file', new Blob([bytes], { type: 'image/webp' }), 'photo.webp');
  try {
    const response = await fetcher(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: basicAuth(config) }, body,
    });
    if (!response.ok) throw new Error('Upload failed.');
    const result = await response.json();
    if (result.public_id !== publicId || result.resource_type !== 'image' ||
        !isReportImageUrl(result.secure_url, config.cloudName, publicId)) throw new Error('Invalid upload response.');
    return { path: publicId, url: result.secure_url };
  } catch { throw new Error('Photo upload failed. Please retry.'); }
}
export async function destroyImage(id, config, fetcher = fetch) {
  const params = { invalidate: 'true', public_id: reportImageId(id), timestamp: String(Math.floor(Date.now() / 1000)) };
  const body = new URLSearchParams({ ...params, api_key: config.apiKey, signature: cloudinarySignature(params, config.apiSecret) });
  try {
    const response = await fetcher(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000), body,
    });
    if (!response.ok) throw new Error('Cleanup failed.');
    const result = await response.json();
    if (!['ok', 'not found'].includes(result.result)) throw new Error('Cleanup failed.');
  } catch { throw new Error('Image cleanup requires review.'); }
}
