import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: "http://localhost:4321",
  i18n: { locales: ["en"], defaultLocale: 'en', routing: { prefixDefaultLocale: false } },
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});