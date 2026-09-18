import { timingSafeEqual, createHash } from 'node:crypto';
import { AppError } from './errors';
const attempts = new Map<string, { count: number; reset: number }>();
/** Single-process demo protection; deploy behind a trusted rate-limiting reverse proxy. */
export function throttle(request: Request, scope: string, max = 15) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.reset < now) attempts.delete(key);
  const key = `${scope}:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'}`;
  const entry = attempts.get(key) || { count: 0, reset: now + 60_000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > max) throw new AppError(429, 'Too many requests. Try again in a minute.');
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new AppError(403, 'Cross-origin submissions are not allowed.');
}
export function requireAdmin(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 24)
    throw new AppError(
      503,
      'Authority access is not configured. Set an ADMIN_TOKEN of at least 24 characters on the server.',
    );
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const hash = (v: string) => createHash('sha256').update(v).digest();
  if (!timingSafeEqual(hash(token), hash(expected)))
    throw new AppError(401, 'Invalid authority access token.');
}
export async function limitedBody(request: Request, max: number) {
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > max)
    throw new AppError(413, 'Submission is too large. Maximum photo size is 4 MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, 'Request body is required.');
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new AppError(413, 'Submission is too large. Maximum photo size is 4 MB.');
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts);
}
