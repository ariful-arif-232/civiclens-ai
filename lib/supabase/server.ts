import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../errors';
export const isDemo = () => process.env.DEMO_MODE === 'true';
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new AppError(
      503,
      'Supabase is not configured. Set server credentials or explicitly enable DEMO_MODE.',
    );
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
