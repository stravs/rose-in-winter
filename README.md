# Apartments Rose in winter

Standalone Astro site generated from profile.json.

```sh
npm install
npm run dev -- --host
```

## Languages

English is the default at `/`. Slovenian, German and Italian are at `/sl/`,
`/de/` and `/it/`. Every language has the homepage and all apartment pages.
Apartment URL slugs remain English so language switching preserves the page.

- English property copy: `.data/property.json`
- Translations (Slovenian, German, Italian): `src/translations.ts`
- Display-field localization and URL helpers: `src/i18n.ts`
- Static route generation: `src/pages/[...path].astro`
- Shared templates: `src/components/pages/`

Guest reviews and the hero review excerpt stay in their original language on all
pages. The enquiry form is still a preview and does not send messages.

Fonts are self-hosted in `public/fonts/`. The Latin Extended subsets from Google
Fonts provide č, š, ž (and uppercase forms) for both Newsreader and Manrope;
existing font licenses apply. Font coverage tests use `fc-query` when available.

Check all 24 pages, translation coverage, links and language metadata:

```sh
npm run build
node --test tests/*.test.mjs
```
