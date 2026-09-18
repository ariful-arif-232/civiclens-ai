import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDemo } from '@/lib/runtime';
import { uuidInput } from '@/lib/validation';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = uuidInput.safeParse((await params).id);
  if (!isDemo() || !parsed.success) return new Response(null, { status: 404 });
  try {
    return new Response(
      await readFile(
        path.join(
          process.env.CIVICLENS_DATA_DIR || path.join(process.cwd(), '.data'),
          'images',
          `${parsed.data}.webp`,
        ),
      ),
      {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch {
    return new Response(null, { status: 404 });
  }
}
