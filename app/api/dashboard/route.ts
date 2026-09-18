import { currentReports, aggregateDashboard } from '@/lib/reports-service';
import { apiError } from '@/lib/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json(aggregateDashboard(await currentReports()), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return apiError(error);
  }
}
