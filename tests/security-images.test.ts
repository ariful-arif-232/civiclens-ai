import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateImage } from '../lib/images';
import { limitedBody, checkOrigin, requireAdmin } from '../lib/security';
test('reject forged photo MIME', async () => {
  await assert.rejects(() =>
    validateImage(new File(['<script>bad</script>'], 'fake.png', { type: 'image/png' })),
  );
});
test('decode and normalize valid photos to webp', async () => {
  const original = await sharp({
    create: { width: 20, height: 20, channels: 3, background: '#eee' },
  })
    .png()
    .toBuffer();
  const output = await validateImage(new File([original], 'photo.png', { type: 'image/png' }));
  assert.equal((await sharp(output).metadata()).format, 'webp');
});
test('request limit protects chunked requests without content length', async () => {
  const request = new Request('https://civic.test/api/reports', { method: 'POST', body: '123456' });
  await assert.rejects(() => limitedBody(request, 5));
});
test('cross origin rejected', () =>
  assert.throws(() =>
    checkOrigin(
      new Request('https://civic.test/api/reports', { headers: { origin: 'https://other.test' } }),
    ),
  ));
test('authority writes fail closed', () => {
  const original = process.env.ADMIN_TOKEN;
  delete process.env.ADMIN_TOKEN;
  try {
    assert.throws(() => requireAdmin(new Request('https://civic.test')));
  } finally {
    if (original !== undefined) process.env.ADMIN_TOKEN = original;
  }
});
