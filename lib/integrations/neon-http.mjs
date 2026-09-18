/** Server-side Neon SQL-over-HTTP transport. No credentials are sent in URLs. */
export function neonEndpoint(connectionString) {
  let url;
  try { url = new URL(connectionString); } catch { throw new Error('Invalid DATABASE_URL configuration.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password ||
      !/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) ||
      (url.port && url.port !== '5432') || !url.pathname.slice(1) || url.hash) {
    throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string.');
  }
  return `https://${url.hostname}/sql`;
}
export async function neonRequest(connectionString, query, params = [], fetcher = fetch) {
  const endpoint = neonEndpoint(connectionString);
  try {
    const response = await fetcher(endpoint, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': connectionString,
        'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true' },
      body: JSON.stringify({ query, params: params.map(v => v == null ? null : String(v)) }),
    });
    if (!response.ok) throw new Error('Database request failed.');
    const result = await response.json();
    if (!Array.isArray(result.rows) || !Array.isArray(result.fields)) throw new Error('Invalid database response.');
    return result;
  } catch {
    // Do not propagate driver errors, URLs, SQL, parameters or credentials.
    throw new Error('Database request failed.');
  }
}
/** Queries must return one column containing JSON/JSONB. PostgreSQL performs all type conversion. */
export async function neonJson(connectionString, query, params = [], fetcher = fetch) {
  const result = await neonRequest(connectionString, query, params, fetcher);
  return result.rows.map(row => {
    if (!Array.isArray(row) || row.length !== 1 || typeof row[0] !== 'string')
      throw new Error('Expected a single JSON database column.');
    try { return JSON.parse(row[0]); } catch { throw new Error('Invalid JSON database response.'); }
  });
}
export async function neonTransaction(connectionString, queries, fetcher = fetch) {
  const endpoint = neonEndpoint(connectionString);
  try {
    const response = await fetcher(endpoint, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(30_000),
      headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': connectionString,
        'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true' },
      body: JSON.stringify({ queries: queries.map(q => ({ query: q.query, params: (q.params || []).map(v => v == null ? null : String(v)) })) }),
    });
    if (!response.ok) throw new Error('Transaction failed.');
    const result = await response.json();
    if (!Array.isArray(result.results) || result.results.length !== queries.length) throw new Error('Invalid transaction response.');
    return result.results;
  } catch { throw new Error('Database transaction failed.'); }
}
