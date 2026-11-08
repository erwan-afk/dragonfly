const KEY = '3hulls:back-target';

/** Remember that the visitor is heading to `to` from `from`. */
export function rememberBackTarget(to: string, from: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ to, from }));
  } catch {
    // Storage can be blocked; the back link then falls back to its default.
  }
}

/** Return the remembered origin only if it was recorded for this exact page. */
export function readBackTarget(currentPath: string): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { to, from } = JSON.parse(raw) as { to?: string; from?: string };
    if (to === currentPath && typeof from === 'string' && from.startsWith('/')) {
      return from;
    }
  } catch {
    // Ignore malformed or unavailable storage.
  }
  return null;
}
