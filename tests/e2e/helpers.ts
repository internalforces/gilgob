const DEFAULT_BASE_PATH = '/astro-astro-personal-knowledge-base-digital';

function configuredBasePath(): string {
  const configured = process.env.BASE_PATH;
  if (configured === undefined) return DEFAULT_BASE_PATH;
  if (configured === '' || configured === '/') return '';
  return `/${configured.replace(/^\/+|\/+$/g, '')}`;
}

export function pagePath(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${configuredBasePath()}${suffix}`.replace(/\/{2,}/g, '/');
}
