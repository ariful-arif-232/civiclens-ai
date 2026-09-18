import 'server-only';
import { AppError } from './errors';
import { neonEndpoint } from './integrations/neon-http.mjs';
import { cloudinaryConfig } from './integrations/cloudinary-http.mjs';
import { geminiConfig } from './integrations/gemini-http.mjs';
export function isDemo() {
  const demo = process.env.DEMO_MODE === 'true';
  if (demo && process.env.VERCEL) throw new AppError(503, 'Local demo persistence is not supported on Vercel. Configure live services.');
  return demo;
}
export function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new AppError(503, 'Database is not configured. Set the server-side DATABASE_URL.');
  try { neonEndpoint(value); } catch { throw new AppError(503, 'Database configuration needs administrator review.'); }
  return value;
}
export function requireLiveSubmissionConfig() {
  if (isDemo()) return;
  databaseUrl();
  try { cloudinaryConfig(); geminiConfig(); } catch {
    throw new AppError(503, 'Image storage or AI analysis is not configured. Please contact the administrator.');
  }
  if (process.env.FREE_TIER_CONFIRMED !== 'true') throw new AppError(503, 'Live submissions are disabled until the administrator confirms free-tier quotas.');
}
