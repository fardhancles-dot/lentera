/**
 * GitHub Pages serves project sites from a sub-path (`/lentera/`), while Vercel
 * serves from the domain root. Vite exposes its configured base as
 * `import.meta.env.BASE_URL`; the app uses History API routes, so links, auth
 * redirects and route matching must add/strip that prefix explicitly.
 */
export function normalizeBase(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export const basePath = normalizeBase(import.meta.env.BASE_URL);

/** Browser path (`/lentera/learn/ipa`) → app route (`/learn/ipa`). */
export function stripBase(pathname: string, base: string = basePath): string {
  if (!base) return pathname || '/';
  if (pathname === base) return '/';
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
  return pathname || '/';
}

/** App route (`/learn/ipa`) → browser path (`/lentera/learn/ipa`). */
export function withBase(path: string, base: string = basePath): string {
  if (!base) return path;
  if (path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
