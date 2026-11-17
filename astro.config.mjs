import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// Same file the pages read (src/config/site.ts). site.url is the production origin; preview sites are noindex and get no sitemap.
const siteConfigFile = process.env.SITE_CONFIG_FILE ?? '.data/site.json';
const siteConfig = existsSync(siteConfigFile) ? JSON.parse(readFileSync(siteConfigFile, 'utf8')).site ?? {} : {};

export default defineConfig({
  output: 'static',
  site: siteConfig.url ?? "http://localhost:4321",
  trailingSlash: 'always',
  i18n: { locales: ["en", "sl", "de", "it"], defaultLocale: 'en', routing: { prefixDefaultLocale: false } },
  integrations: siteConfig.preview ? [] : [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
