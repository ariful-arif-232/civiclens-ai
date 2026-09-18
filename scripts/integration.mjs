import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const directory = await mkdtemp(path.join(tmpdir(), 'civiclens-test-'));
const token = crypto.randomUUID() + crypto.randomUUID();
const port = Number(process.env.TEST_PORT || 3107);
const base = `http://127.0.0.1:${port}`;
let server;
async function launch(demo = true) {
  server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      env: {
        ...process.env,
        DEMO_MODE: String(demo),
        ADMIN_TOKEN: token,
        CIVICLENS_DATA_DIR: directory,
        DATABASE_URL: '',
        GEMINI_API_KEY: '',
        VERCEL: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let logs = '';
  server.stdout.on('data', (b) => (logs += b));
  server.stderr.on('data', (b) => (logs += b));
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(base);
      if (response.status === 200) return;
    } catch {}
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error(`Server did not start: ${logs}`);
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const ended = new Promise((r) => server.once('exit', r));
  server.kill('SIGTERM');
  await ended;
}
const image = await sharp({
  create: { width: 640, height: 480, channels: 3, background: '#75816e' },
})
  .png()
  .toBuffer();
function form(photo = image, type = 'image/png') {
  const f = new FormData();
  f.set('photo', new File([photo], 'test.png', { type }));
  f.set('title', 'Deep pothole near the main crossing');
  f.set('description', 'A large deep pothole makes this road unsafe for students crossing.');
  f.set('area', 'University Main Gate');
  f.set('latitude', '');
  f.set('longitude', '');
  return f;
}
async function json(route, options) {
  const response = await fetch(base + route, options);
  return { status: response.status, body: await response.json() };
}
try {
  await launch();
  for (const route of ['/', '/report', '/issues', '/dashboard', '/admin'])
    assert.equal((await fetch(base + route)).status, 200, route);
  const before = await json('/api/dashboard');
  assert.equal(before.body.totalReports, 12);
  const created = await json('/api/reports', { method: 'POST', body: form() });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const report = created.body.report;
  assert.equal(report.analysis_source, 'mock');
  assert.equal(report.risk_score, 80);
  assert.equal(report.related_count, 5);
  assert.equal(report.status, 'reported');
  assert.equal((await fetch(base + report.image_url)).headers.get('content-type'), 'image/webp');
  assert.equal((await fetch(base + `/issues/${report.id}`)).status, 200);
  assert.equal((await json(`/api/reports/${report.id}`)).body.report.id, report.id);
  const after = await json('/api/dashboard');
  assert.equal(after.body.totalReports, 13);
  assert.equal(after.body.criticalIssues, before.body.criticalIssues + 1);
  const filtered = await json(
    '/api/reports?category=road_damage&severity=high&status=reported&area=MAIN%20GATE&sort=newest',
  );
  assert.ok(filtered.body.reports.some((r) => r.id === report.id));
  assert.ok(
    filtered.body.reports.every(
      (r) => r.category === 'road_damage' && r.severity === 'high' && r.status === 'reported',
    ),
  );
  assert.equal((await json('/api/reports?category=bad')).status, 400);
  assert.equal((await json('/api/reports/not-a-uuid')).status, 400);
  assert.equal((await json('/api/reports/20000000-0000-4000-8000-000000000099')).status, 404);
  assert.equal(
    (await json('/api/reports', { method: 'POST', body: form(Buffer.from('<svg/>')) })).status,
    400,
  );
  assert.equal(
    (
      await json('/api/reports', {
        method: 'POST',
        body: form(),
        headers: { Origin: 'https://evil.example' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await json('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ title: 'bad' }),
        headers: { 'Content-Type': 'application/json' },
      })
    ).status,
    415,
  );
  const patch = (status, expectedStatus, authorized = true) =>
    json(`/api/reports/${report.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, expectedStatus }),
    });
  assert.equal((await patch('under_review', 'reported', false)).status, 401);
  assert.equal((await patch('resolved', 'reported')).status, 409);
  assert.equal((await patch('under_review', 'reported')).status, 200);
  assert.equal((await patch('under_review', 'reported')).status, 409);
  assert.equal((await patch('in_progress', 'under_review')).status, 200);
  assert.equal((await patch('resolved', 'in_progress')).status, 200);
  const resolvedDashboard = await json('/api/dashboard');
  assert.equal(resolvedDashboard.body.resolvedIssues, 3);
  assert.ok(!resolvedDashboard.body.topPriorityIssues.some((r) => r.id === report.id));
  // Restart verifies durable demo data, not just an in-memory response.
  await stop();
  await launch();
  assert.equal((await json(`/api/reports/${report.id}`)).body.report.status, 'resolved');
  const stored = JSON.parse(await readFile(path.join(directory, 'reports.json'), 'utf8'));
  assert.equal(stored.length, 13);
  await stop();
  await launch(false);
  assert.equal((await json('/api/reports', { method: 'POST', body: form() })).status, 503);
  console.log(
    'PASS: production HTTP flow, 6 pages, upload + analysis + score + persistence, filtering, dashboard, authorization, status transitions, conflict detection, restart durability and missing-configuration errors.',
  );
} finally {
  await stop();
  await rm(directory, { recursive: true, force: true });
}
