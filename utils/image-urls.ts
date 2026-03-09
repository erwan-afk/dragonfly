/**
 * Server-side image URL normalization for R2 storage.
 * Uses server env vars: R2_PUBLIC_URL, R2_ACCOUNT_ID, R2_BUCKET_NAME
 */

export function normalizeImageUrl(
  value: any,
  boatId?: string
): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Handle temporary session URLs - these indicate unprocessed uploads
  if (trimmed.includes('temp_session_') && trimmed.startsWith('http')) {
    return '';
  }

  // Full URLs pass through
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative URLs pass through
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // R2 key → construct full URL
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

  if (R2_PUBLIC_URL) {
    const hasProtocol =
      R2_PUBLIC_URL.startsWith('http://') ||
      R2_PUBLIC_URL.startsWith('https://');
    const base = hasProtocol ? R2_PUBLIC_URL : `https://${R2_PUBLIC_URL}`;
    return `${base}/${trimmed}`;
  }

  if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmed}`;
  }

  return trimmed;
}

export function normalizeImageUrls(
  photos: any,
  boatId?: string
): string[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return [];

  return photos
    .map((url) => normalizeImageUrl(url, boatId))
    .filter((url) => url !== '');
}
