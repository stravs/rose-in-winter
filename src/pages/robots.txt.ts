import type { APIRoute } from 'astro';
import { getSiteConfig } from '../config/site';

export const GET: APIRoute = async ({ site, url }) => {
  const config = await getSiteConfig();
  const content = config.site.preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /setup\nDisallow: /api/\nSitemap: ${new URL('/sitemap-index.xml', site ?? url.origin).href}\n`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
