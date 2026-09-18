import 'server-only';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import type { Report, Status } from './types';
import { isDemo } from './runtime';
import { queryJson } from './db/client';
import { cloudinaryConfig, uploadImage, destroyImage, isReportImageUrl } from './integrations/cloudinary-http.mjs';
import { seedReports } from './demo-data';
import { AppError } from './errors';
const directory = process.env.CIVICLENS_DATA_DIR || path.join(process.cwd(), '.data');
const filename = path.join(directory, 'reports.json');
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}
async function demoRead(): Promise<Report[]> {
  try {
    return JSON.parse(await readFile(filename, 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    const rows = seedReports();
    await demoWrite(rows);
    return rows;
  }
}
async function demoWrite(rows: Report[]) {
  await mkdir(directory, { recursive: true });
  const temp = `${filename}.${crypto.randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(rows), { mode: 0o600 });
  await rename(temp, filename);
}
export async function listRaw(): Promise<Report[]> {
  if (isDemo()) return locked(demoRead);
  const rows = await queryJson<Report>(`SELECT to_jsonb(r) FROM
    (SELECT * FROM public.reports WHERE NOT is_demo ORDER BY id LIMIT 10001) r`);
  if (rows.length > 10000) throw new AppError(503, 'This dataset needs database-side pagination before further growth.');
  return rows;
}
export async function getRawById(id: string): Promise<Report | null> {
  if (isDemo()) return (await locked(demoRead)).find(r => r.id === id) || null;
  return (await queryJson<Report>('SELECT to_jsonb(r) FROM public.reports r WHERE id=$1::uuid', [id]))[0] || null;
}
export async function insertReport(report: Report) {
  if (isDemo()) return locked(async () => {
    const rows = await demoRead(); rows.push(report); await demoWrite(rows); return report;
  });
  const rows = await queryJson<Report>(`INSERT INTO public.reports (
    id,title,description,image_path,image_url,category,severity,ai_summary,ai_reasoning,
    analysis_source,area,area_key,latitude,longitude,status,risk_score,related_count,is_demo,created_at,updated_at
  ) SELECT id,title,description,image_path,image_url,category,severity,ai_summary,ai_reasoning,
    analysis_source,area,area_key,latitude,longitude,status,risk_score,related_count,is_demo,created_at,updated_at
    FROM jsonb_populate_record(NULL::public.reports,$1::jsonb) RETURNING to_jsonb(reports)`, [JSON.stringify(report)]);
  if (!rows[0]) throw new AppError(503, 'Could not confirm report persistence.');
  return rows[0];
}
export async function updateStatus(id: string, status: Status, expected: Status) {
  if (isDemo()) return locked(async () => {
    const rows = await demoRead(); const row = rows.find(r => r.id === id);
    if (!row) throw new AppError(404, 'Report not found.');
    if (row.status !== expected) throw new AppError(409, 'This report changed. Refresh and try again.');
    row.status = status; row.updated_at = new Date().toISOString(); await demoWrite(rows); return row;
  });
  const rows = await queryJson<Report>(`UPDATE public.reports SET status=$2
    WHERE id=$1::uuid AND status=$3 AND NOT is_demo RETURNING to_jsonb(reports)`, [id, status, expected]);
  if (!rows[0]) throw new AppError(409, 'This report changed or no longer exists. Refresh and try again.');
  return rows[0];
}
export async function attachImage(report: Report): Promise<Report> {
  if (!report.image_path) return { ...report, image_url: null };
  if (isDemo()) return { ...report, image_url: `/api/reports/${report.id}/image` };
  const valid = isReportImageUrl(report.image_url, process.env.CLOUDINARY_CLOUD_NAME || '', `civiclens-ai/reports/${report.id}`);
  return { ...report, image_url: valid ? report.image_url : null };
}
export async function saveImage(id: string, bytes: Buffer): Promise<{path: string; url: string}> {
  if (isDemo()) {
    await mkdir(path.join(directory, 'images'), { recursive: true });
    await writeFile(path.join(directory, 'images', `${id}.webp`), bytes);
    return { path: `reports/${id}/photo.webp`, url: `/api/reports/${id}/image` };
  }
  try { return await uploadImage(id, bytes, cloudinaryConfig()); }
  catch { throw new AppError(503, 'Photo upload failed. Please retry.'); }
}
export async function removeImage(id: string, objectPath: string) {
  if (isDemo()) {
    const { unlink } = await import('node:fs/promises');
    await unlink(path.join(directory, 'images', `${id}.webp`)).catch(() => {});
  } else {
    if (objectPath !== `civiclens-ai/reports/${id}`) throw new AppError(400, 'Invalid cleanup target.');
    await destroyImage(id, cloudinaryConfig());
  }
}
