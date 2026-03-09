import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeImageUrl, normalizeImageUrls } from '@/utils/image-urls';

describe('normalizeImageUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should pass through full https URLs', () => {
    expect(normalizeImageUrl('https://example.com/image.webp')).toBe(
      'https://example.com/image.webp'
    );
  });

  it('should pass through full http URLs', () => {
    expect(normalizeImageUrl('http://example.com/image.webp')).toBe(
      'http://example.com/image.webp'
    );
  });

  it('should pass through relative URLs starting with /', () => {
    expect(normalizeImageUrl('/images/boat.webp')).toBe('/images/boat.webp');
  });

  it('should construct full URL from R2 key using R2_PUBLIC_URL', () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com');
    expect(normalizeImageUrl('boats/123/photo.webp')).toBe(
      'https://cdn.example.com/boats/123/photo.webp'
    );
  });

  it('should add protocol to R2_PUBLIC_URL if missing', () => {
    vi.stubEnv('R2_PUBLIC_URL', 'cdn.example.com');
    expect(normalizeImageUrl('boats/123/photo.webp')).toBe(
      'https://cdn.example.com/boats/123/photo.webp'
    );
  });

  it('should fallback to R2_ACCOUNT_ID + R2_BUCKET_NAME', () => {
    vi.stubEnv('R2_PUBLIC_URL', '');
    vi.stubEnv('R2_ACCOUNT_ID', 'acc123');
    vi.stubEnv('R2_BUCKET_NAME', 'mybucket');
    expect(normalizeImageUrl('boats/123/photo.webp')).toBe(
      'https://mybucket.acc123.r2.cloudflarestorage.com/boats/123/photo.webp'
    );
  });

  it('should return key as-is if no env vars set', () => {
    vi.stubEnv('R2_PUBLIC_URL', '');
    vi.stubEnv('R2_ACCOUNT_ID', '');
    vi.stubEnv('R2_BUCKET_NAME', '');
    expect(normalizeImageUrl('boats/123/photo.webp')).toBe(
      'boats/123/photo.webp'
    );
  });

  it('should return empty string for temp_session_ URLs', () => {
    expect(
      normalizeImageUrl('https://r2.example.com/temp_session_abc123/photo.webp')
    ).toBe('');
  });

  it('should return empty string for null input', () => {
    expect(normalizeImageUrl(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(normalizeImageUrl(undefined)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(normalizeImageUrl('')).toBe('');
  });

  it('should return empty string for whitespace-only input', () => {
    expect(normalizeImageUrl('   ')).toBe('');
  });

  it('should trim whitespace from URLs', () => {
    expect(normalizeImageUrl('  https://example.com/image.webp  ')).toBe(
      'https://example.com/image.webp'
    );
  });
});

describe('normalizeImageUrls', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should normalize an array of URLs', () => {
    const result = normalizeImageUrls([
      'https://example.com/a.webp',
      'https://example.com/b.webp'
    ]);
    expect(result).toEqual([
      'https://example.com/a.webp',
      'https://example.com/b.webp'
    ]);
  });

  it('should filter out empty strings from temp URLs', () => {
    const result = normalizeImageUrls([
      'https://example.com/a.webp',
      'https://r2.example.com/temp_session_abc/photo.webp',
      'https://example.com/b.webp'
    ]);
    expect(result).toEqual([
      'https://example.com/a.webp',
      'https://example.com/b.webp'
    ]);
  });

  it('should filter out null/empty entries', () => {
    const result = normalizeImageUrls([
      'https://example.com/a.webp',
      '',
      null,
      undefined,
      '   ',
      'https://example.com/b.webp'
    ]);
    expect(result).toEqual([
      'https://example.com/a.webp',
      'https://example.com/b.webp'
    ]);
  });

  it('should return empty array for null input', () => {
    expect(normalizeImageUrls(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(normalizeImageUrls(undefined)).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(normalizeImageUrls('not an array')).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    expect(normalizeImageUrls([])).toEqual([]);
  });
});
