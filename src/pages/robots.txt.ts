import { SITE_CONFIG, withBase } from '../config/site';

export function GET() {
  const sitemap = new URL(withBase('/sitemap-index.xml'), SITE_CONFIG.site).href;
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
