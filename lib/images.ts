import sharp from 'sharp';
import { AppError } from './errors';
import { MAX_IMAGE_BYTES } from './validation';
export async function validateImage(file: File) {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
    throw new AppError(400, 'Choose a photo between 1 byte and 4 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new AppError(400, 'Only JPEG, PNG and WebP photos are supported.');
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 25_000_000, animated: false });
    const meta = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new Error('Invalid format');
    return await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new AppError(
      400,
      'This photo cannot be read. Use a valid JPEG, PNG or WebP under 25 megapixels.',
    );
  }
}
