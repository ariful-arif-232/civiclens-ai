import { isDemo } from '@/lib/runtime';
import { queryJson } from '@/lib/db/client';
import { cloudinaryConfig } from '@/lib/integrations/cloudinary-http.mjs';
import { geminiConfig } from '@/lib/integrations/gemini-http.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    if (isDemo()) return Response.json({ status: 'demo', database: 'local', ai: 'mock' }, { headers });
    const [exists] = await queryJson<boolean>(`SELECT to_jsonb(EXISTS(
      SELECT 1 FROM public.civiclens_migrations WHERE version='001_civiclens'))`);
    cloudinaryConfig(); geminiConfig();
    if (!exists || !process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 24 || process.env.FREE_TIER_CONFIRMED !== 'true')
      throw new Error('Not ready');
    return Response.json({ status: 'ready', database: 'neon', ai: 'configured-not-tested', storage: 'configured-not-tested' }, { headers });
  } catch {
    return Response.json({ status: 'not-ready', message: 'Administrator setup is required.' }, { status: 503, headers });
  }
}
