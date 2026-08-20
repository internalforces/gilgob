const base = (process.env.BASE_PATH ?? '/astro-astro-personal-knowledge-base-digital').replace(/\/$/, '');

export const SITE_CONFIG = {
  name: 'gilgob',
  author: 'internalforces',
  locale: 'ko-KR',
  github: 'https://github.com/internalforces',
  site: process.env.SITE_URL ?? 'https://internalforces.github.io',
  base,
} as const;

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.base}${normalized}`.replace(/\/+/g, '/');
}
