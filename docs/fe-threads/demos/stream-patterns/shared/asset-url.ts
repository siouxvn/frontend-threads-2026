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

// Hosted on Cloudflare R2 (public bucket) — CORS-enabled, zero egress cost.
// Moved off GitHub Release because release assets don't send CORS headers,
// which blocks the streaming demos that use fetch().body.getReader().
export const VIETNAM_4K_VIDEO_URL =
  'https://pub-2bb90384da7a411ab6da852de525941a.r2.dev/4K_19m_Vietnam.webm';
