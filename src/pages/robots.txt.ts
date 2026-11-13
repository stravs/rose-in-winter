import type { APIRoute } from 'astro';
import { getSiteConfig } from '../config/site';

// Preview pages carry <meta name="robots" content="noindex">; crawlers must be allowed to fetch them to see it.
export const GET: APIRoute = async ({ site, url }) => {
  const config = await getSiteConfig();
  const sitemap = config.site.preview ? '' : `Sitemap: ${new URL('/sitemap-index.xml', site ?? url.origin).href}\n`;
  return new Response(`User-agent: *\nAllow: /\n${sitemap}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
