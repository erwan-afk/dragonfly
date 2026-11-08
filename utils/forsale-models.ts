import { dragonflyModels } from '@/utils/constants';

/** `df28` -> `dragonfly-28`, used in /forsale/<slug> URLs. */
export const modelSlug = (key: string): string =>
  key.replace(/^df/, 'dragonfly-');

/** `dragonfly-28` -> `df28`, or null when the slug is not a known model. */
export function modelKeyFromSlug(slug: string): string | null {
  if (!slug.startsWith('dragonfly-')) return null;
  const key = slug.replace(/^dragonfly-/, 'df');
  return dragonflyModels.some((m) => m.key === key) ? key : null;
}
