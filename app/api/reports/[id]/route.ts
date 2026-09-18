import { uuidInput, patchInput, transitions } from '@/lib/validation';
import { apiError, AppError } from '@/lib/errors';
import { currentReports, withImages } from '@/lib/reports-service';
import { updateStatus } from '@/lib/repository';
import { requireAdmin, throttle, checkOrigin, limitedBody } from '@/lib/security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const id = uuidInput.parse((await context.params).id);
    const report = (await currentReports()).find((r) => r.id === id);
    if (!report) throw new AppError(404, 'Report not found.');
    return Response.json(
      { report: (await withImages([report]))[0] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    throttle(request, 'admin', 30);
    requireAdmin(request);
    const id = uuidInput.parse((await context.params).id);
    let body;
    try {
      body = JSON.parse((await limitedBody(request, 2048)).toString());
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(400, 'Invalid JSON.');
    }
    const { status, expectedStatus } = patchInput.parse(body);
    if (!transitions[expectedStatus].includes(status))
      throw new AppError(409, 'This status transition is not allowed.');
    await updateStatus(id, status, expectedStatus);
    return GET(request, context);
  } catch (error) {
    return apiError(error);
  }
}
