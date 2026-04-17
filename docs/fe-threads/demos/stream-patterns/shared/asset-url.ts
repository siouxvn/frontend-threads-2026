// Resolve a path under docs/public/ to a URL that works whether the site
// is served at the root or under the Dumi base path. Mirrors the detection
// used by src/mocks/api-mocks.ts#handleDumiBasePath.
const BASE = '/frontend-threads-2026';

export const publicAsset = (path: string): string => {
  const rel = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return `${BASE}${rel}`;
  return window.location.pathname.startsWith(`${BASE}/`)
    ? `${BASE}${rel}`
    : rel;
};
