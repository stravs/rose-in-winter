import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { messages } from '../src/translations.ts';
import { spawnSync } from 'node:child_process';

// Run after npm run build. No network, browser, models or live property capture.
const property = JSON.parse(readFileSync(new URL('../.data/property.json', import.meta.url)));
const languages = ['en', 'sl', 'de', 'it'];
const slug = name => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pages = ['', ...property.units.map(unit => `units/${slug(unit.name)}/`)];
const path = (language, page) => `${language === 'en' ? '/' : `/${language}/`}${page}`;
const htmlAt = path => readFileSync(new URL(`../dist${path}index.html`, import.meta.url), 'utf8');

for (const language of languages) {
  test(`${language}: all six pages have matching metadata and reciprocal language links`, () => {
    for (const page of pages) {
      const html = htmlAt(path(language, page));
      assert.match(html, new RegExp(`<html lang="${language}"`));
      const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
      assert.ok(canonical);
      assert.equal(new URL(canonical).pathname, path(language, page));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      for (const target of languages) {
        const href = html.match(new RegExp(`rel="alternate" hreflang="${target}" href="([^"]+)"`))?.[1];
        assert.equal(new URL(href).pathname, path(target, page));
        assert.ok(html.includes(`href="${path(target, page)}" lang="${target}"`), 'Switcher must stay on the same apartment');
      }
      assert.ok(html.includes('hreflang="x-default"'));
      for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
        if (!href.startsWith('/')) continue;
        const destination = new URL(href, canonical);
        assert.ok(existsSync(new URL(`../dist${destination.pathname}index.html`, import.meta.url)), `Broken link: ${href}`);
        if (destination.hash) assert.ok(htmlAt(destination.pathname).includes(`id="${destination.hash.slice(1)}"`), `Missing anchor: ${href}`);
      }
      if (language !== 'en') {
        assert.doesNotMatch(html, /extra-large double bed|large double bed|Send enquiry|All apartments|Previous photo|Close photos|under the trees/);
        const index = languages.indexOf(language) - 1;
        assert.ok(html.includes(messages['Send enquiry'][index]));
        assert.ok(html.includes(messages['Preview: enquiries are not sent yet.'][index]));
      }
    }
  });
}

test('all profile display copy has three non-empty translations', () => {
  const required = new Set();
  const add = value => { if (value) required.add(value); };
  add(property.description); add(property.country);
  property.amenities.forEach(add);
  property.photos.forEach(photo => add(photo.alt));
  for (const unit of property.units) {
    add(unit.name); add(unit.description); add(unit.occupancyLabel);
    unit.rooms.forEach(room => { add(room.name); room.beds.split(' · ').forEach(add); });
    unit.amenities.forEach(add); unit.photos.forEach(photo => add(photo.alt));
  }
  const story = property.narrative;
  ['heroTitle', 'heroText', 'introTitle', 'introText', 'hostQuote', 'hostText', 'heroEyebrow', 'locationText'].forEach(key => add(story[key]));
  story.practical.forEach(item => { add(item.label); add(item.value); });
  story.highlights.forEach(item => { add(item.title); add(item.text); });
  add(property.bookingRating.label);
  property.bookingRating.categories.forEach(item => add(item.label));
  property.testimonials.forEach(review => add(review.country));
  property.host.languages.forEach(add);
  property.nearby.forEach(place => {
    if (place.name !== 'Pokljuka') add(place.name);
    add(place.note);
    if (place.distance.includes('drive')) add(place.distance);
  });
  for (const source of required) {
    assert.equal(messages[source]?.length, 3, `Missing translation: ${source}`);
    assert.ok(messages[source].every(text => text.trim().length));
  }
});

test('responsive header has an accessible native mobile menu in every language', () => {
  for (const language of languages) {
    for (const page of pages) {
      const html = htmlAt(path(language, page));
      assert.match(html, /<details[^>]*data-header-disclosure[^>]*data-mobile-menu/);
      assert.match(html, /<summary[^>]*aria-controls="mobile-navigation"/);
      assert.match(html, /id="mobile-navigation"/);
      assert.match(html, /id="desktop-languages"/);
      const mobile = html.split('id="mobile-navigation"')[1].split('</header>')[0];
      assert.match(html, /<details[^>]*data-desktop-apartments/);
      assert.match(html, /id="desktop-apartments"/);
      assert.match(mobile, /<details open[^>]*data-apartments-menu/);
      assert.match(mobile, /aria-controls="mobile-apartments"/);
      assert.match(mobile, /id="mobile-apartments"/);
      const allApartments = language === 'en' ? 'All apartments' : messages['All apartments'][languages.indexOf(language) - 1];
      assert.ok(!mobile.includes(allApartments), 'Mobile menu should not include All apartments');
      for (const unit of property.units) {
        assert.ok(mobile.includes(`href="${path(language, `units/${slug(unit.name)}/`)}"`));
      }
      for (const section of ['apartments', 'reviews', 'location']) {
        assert.ok(mobile.includes(`href="${path(language, '')}#${section}"`));
      }
      assert.ok(mobile.includes('href="#enquiry"'));
      for (const target of languages) {
        assert.ok(mobile.includes(`href="${path(target, page)}" lang="${target}"`));
      }
    }
  }
});

test('guest reviews and the hero excerpt stay verbatim in every language', () => {
  const decode = html => html.replaceAll('&#39;', "'").replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&');
  for (const language of languages) {
    const html = decode(htmlAt(path(language, '')));
    for (const review of property.testimonials) {
      assert.ok(html.includes(`“${review.quote}”`), `${language}: review by ${review.author} changed`);
    }
    assert.ok(html.includes(`“${property.narrative.heroQuote.quote}”`));
    assert.equal((html.match(/<blockquote lang="en"/g) ?? []).length, property.testimonials.length);
    assert.doesNotMatch(html, /Translated from the original guest reviews|Prevod izvirnih mnenj|Gästebewertungen übersetzt|Traduzione delle recensioni/);
  }
});

test('both extended fonts contain čČšŠžŽ', t => {
  for (const family of ['manrope', 'newsreader']) {
    const file = `public/fonts/${family}-latin-ext.woff2`;
    assert.ok(existsSync(file));
    const result = spawnSync('fc-query', ['--format', '%{charset}\\n', file], { encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') { t.skip('Fontconfig fc-query is not installed'); return; }
    assert.equal(result.status, 0);
    const ranges = result.stdout.split('\n')[0].split(' ').map(range => range.split('-').map(n => parseInt(n, 16)));
    for (const character of 'čČšŠžŽ') {
      const code = character.codePointAt(0);
      assert.ok(ranges.some(([start, end = start]) => code >= start && code <= end), `${family}: missing ${character}`);
    }
    const css = readFileSync('src/styles/site.css', 'utf8');
    assert.ok(css.includes(`url('/fonts/${family}-latin-ext.woff2')`));
    assert.ok(existsSync(`dist/fonts/${family}-latin-ext.woff2`));
  }
});

test('translations preserve interpolation placeholders', () => {
  const placeholders = value => [...value.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
  for (const [source, translations] of Object.entries(messages)) {
    for (const translation of translations) assert.deepEqual(placeholders(translation), placeholders(source), source);
  }
});
