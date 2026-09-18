export function neonEndpoint(connectionString: string): string;
export function neonRequest(connectionString: string, query: string, params?: unknown[], fetcher?: typeof fetch): Promise<{rows: unknown[][]; fields: unknown[]}>;
export function neonJson<T>(connectionString: string, query: string, params?: unknown[], fetcher?: typeof fetch): Promise<T[]>;
export function neonTransaction(connectionString: string, queries: {query: string; params?: unknown[]}[], fetcher?: typeof fetch): Promise<unknown[]>;
