/**
 * Video URL validation and embed URL conversion utilities.
 *
 * Supports YouTube, Vimeo, and Dailymotion URLs.
 */

const VIDEO_PATTERNS: {
  name: string;
  // Regex to test whether a URL belongs to this platform
  test: RegExp;
  // Extracts the video ID and returns the embed URL, or null if no match
  toEmbed: (url: string) => string | null;
}[] = [
  {
    name: 'YouTube',
    test: /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    toEmbed: (url: string) => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      return match
        ? `https://www.youtube.com/embed/${match[1]}`
        : null;
    },
  },
  {
    name: 'Vimeo',
    test: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/,
    toEmbed: (url: string) => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/
      );
      return match
        ? `https://player.vimeo.com/video/${match[1]}`
        : null;
    },
  },
  {
    name: 'Dailymotion',
    test: /^https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
    toEmbed: (url: string) => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/
      );
      return match
        ? `https://www.dailymotion.com/embed/video/${match[1]}`
        : null;
    },
  },
];

/**
 * Returns `true` if the given URL is a valid YouTube, Vimeo, or Dailymotion video URL.
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return VIDEO_PATTERNS.some((pattern) => pattern.test.test(url.trim()));
}

/**
 * Converts a normal video URL into its embeddable equivalent.
 * Returns `null` if the URL is not recognised.
 */
export function getVideoEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  for (const pattern of VIDEO_PATTERNS) {
    const embedUrl = pattern.toEmbed(trimmed);
    if (embedUrl) return embedUrl;
  }
  return null;
}
