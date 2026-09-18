import { reportInput, MAX_IMAGE_BYTES } from '@/lib/validation';
import { apiError, AppError } from '@/lib/errors';
import { throttle, checkOrigin, limitedBody } from '@/lib/security';
import { validateImage } from '@/lib/images';
import { isDemo, requireLiveSubmissionConfig } from '@/lib/runtime';
import { reserveReportBudget } from '@/lib/budget';
import { DemoProvider, GeminiVisionProvider } from '@/lib/ai/provider';
import { analyzeInfrastructureReport } from '@/lib/ai/analyze-report';
import { listRaw, insertReport, saveImage, removeImage, attachImage, getRawById } from '@/lib/repository';
import { normalizeArea, scoreReports } from '@/lib/related-reports';
import { currentReports, filterReports, withImages } from '@/lib/reports-service';
import type { Report } from '@/lib/types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function POST(request: Request) {
  let uploaded: {path: string; url: string} | undefined;
  let id: string | undefined;
  let saved = false;
  let insertAttempted = false;
  try {
    checkOrigin(request);
    throttle(request, 'create', 10);
    requireLiveSubmissionConfig();
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new AppError(415, 'Submit a multipart form with a photo.');
    const bytes = await limitedBody(request, MAX_IMAGE_BYTES + 32_768);
    let form: FormData;
    try {
      form = await new Response(bytes, {
        headers: { 'Content-Type': request.headers.get('content-type')! },
      }).formData();
    } catch {
      throw new AppError(400, 'Invalid multipart form.');
    }
    const fields = Object.fromEntries([...form.entries()].filter(([key]) => key !== 'photo'));
    const input = reportInput.parse(fields);
    const photo = form.get('photo');
    if (!(photo instanceof File)) throw new AppError(400, 'A photo is required.');
    const image = await validateImage(photo);
    await reserveReportBudget(request);
    id = crypto.randomUUID();
    uploaded = await saveImage(id, image);
    const analysis = await analyzeInfrastructureReport(
      {
        description: input.description,
        imageData: `data:image/webp;base64,${image.toString('base64')}`,
      },
      isDemo() ? new DemoProvider() : new GeminiVisionProvider(),
      isDemo() ? 'mock' : 'vision',
    );
    const now = new Date().toISOString();
    const report: Report = {
      ...input,
      id,
      image_path: uploaded.path,
      image_url: uploaded.url,
      category: analysis.category,
      severity: analysis.severity,
      ai_summary: analysis.summary,
      ai_reasoning: analysis.reasoning,
      analysis_source: analysis.source,
      area_key: normalizeArea(input.area),
      status: 'reported',
      risk_score: 0,
      related_count: 1,
      is_demo: isDemo(),
      created_at: now,
      updated_at: now,
    };
    const scored = scoreReports([...(await listRaw()), report]).find((r) => r.id === id)!;
    insertAttempted = true;
    await insertReport({
      ...report,
      risk_score: scored.risk_score,
      related_count: scored.related_count,
    });
    saved = true;
    return Response.json(
      { report: { ...scored, ...(await attachImage(scored)) } },
      { status: 201 },
    );
  } catch (error) {
    if (uploaded && id && !saved) {
      // An insert can commit even if its HTTP response times out. Never delete its photo blindly.
      let safeToRemove = !insertAttempted;
      if (insertAttempted) {
        try {
          const persisted = await getRawById(id);
          if (persisted) return Response.json({ report: (await withImages(scoreReports([persisted])))[0] }, { status: 201 });
          safeToRemove = true;
        } catch { /* Preserve the photo if the database outcome is unknown. */ }
      }
      if (safeToRemove) await removeImage(id, uploaded.path).catch(() => {});
    }
    return apiError(error);
  }
}
export async function GET(request: Request) {
  try {
    const result = filterReports(
      await currentReports(),
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return Response.json(
      { ...result, reports: await withImages(result.reports) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
