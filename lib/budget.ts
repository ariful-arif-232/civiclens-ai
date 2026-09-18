import 'server-only';
import { createHmac } from 'node:crypto';
import { isDemo } from './runtime';
import { queryJson } from './db/client';
import { AppError } from './errors';
async function reserve(key: string, start: string, max: number) {
  const rows = await queryJson<number>(`
    WITH updated AS (
      INSERT INTO public.civiclens_rate_limits(key,window_start,attempts) VALUES ($1,$2::timestamptz,1)
      ON CONFLICT(key,window_start) DO UPDATE SET attempts=civiclens_rate_limits.attempts+1
      WHERE civiclens_rate_limits.attempts < $3::int RETURNING attempts
    ) SELECT to_jsonb(attempts) FROM updated`, [key, start, max]);
  if (!rows.length) throw new AppError(429, 'The demo request limit has been reached. Please try later.');
}
/** Persisted limits work across serverless instances. Daily reservation bounds uploads and AI attempts. */
export async function reserveReportBudget(request: Request) {
  if (isDemo()) return;
  const salt = process.env.ADMIN_TOKEN;
  if (!salt || salt.length < 24) throw new AppError(503, 'Server protection is not configured.');
  const raw = Number(process.env.MAX_REPORTS_PER_DAY || 20);
  if (!Number.isInteger(raw) || raw < 1 || raw > 100) throw new AppError(503, 'Invalid daily report budget.');
  const now = new Date();
  const ip = request.headers.get(process.env.VERCEL ? 'x-vercel-forwarded-for' : 'x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const digest = createHmac('sha256', salt).update(now.toISOString().slice(0, 10) + ip).digest('hex');
  await reserve(`create:ip:${digest}`, new Date(Math.floor(now.getTime()/60_000)*60_000).toISOString(), 3);
  await reserve('create:global-minute', new Date(Math.floor(now.getTime()/60_000)*60_000).toISOString(), 5);
  await reserve('create:global-day', now.toISOString().slice(0, 10)+'T00:00:00.000Z', raw);
}
