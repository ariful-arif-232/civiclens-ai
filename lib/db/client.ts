import 'server-only';
import { neonJson } from '../integrations/neon-http.mjs';
import { databaseUrl } from '../runtime';
import { AppError } from '../errors';
export async function queryJson<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const connection = databaseUrl();
  try { return await neonJson<T>(connection, sql, params); }
  catch { throw new AppError(503, 'Database operation failed. Please retry or contact the administrator.'); }
}
