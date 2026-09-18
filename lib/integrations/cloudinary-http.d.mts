export interface CloudinaryConfig { cloudName: string; apiKey: string; apiSecret: string }
export function cloudinaryConfig(env?: NodeJS.ProcessEnv): CloudinaryConfig;
export function cloudinarySignature(params: Record<string, string>, secret: string): string;
export function reportImageId(id: string): string;
export function isReportImageUrl(url: unknown, cloudName: string, publicId: string): boolean;
export function uploadImage(id: string, bytes: Uint8Array, config: CloudinaryConfig, fetcher?: typeof fetch): Promise<{path: string; url: string}>;
export function destroyImage(id: string, config: CloudinaryConfig, fetcher?: typeof fetch): Promise<void>;
