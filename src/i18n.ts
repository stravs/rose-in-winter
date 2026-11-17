import { messages } from './translations';
import type { Property, PropertyPhoto } from './domain/property';
import { unitSlug } from './domain/unit-path';

export const locales = ['en', 'sl', 'de', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const languageNames: Record<Locale, string> = { en: 'English', sl: 'Slovenščina', de: 'Deutsch', it: 'Italiano' };
export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `${locale === 'en' ? '' : `/${locale}`}/${clean}${clean ? '/' : ''}`;
}
export function localeFromPath(pathname: string): Locale {
  const candidate = pathname.split('/').filter(Boolean)[0];
  return isLocale(candidate) ? candidate : defaultLocale;
}
export function pathWithoutLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return parts.join('/');
}
export function translator(locale: Locale) {
  return (message: string, values: Record<string, string | number> = {}): string => {
    const index = { sl: 0, de: 1, it: 2 }[locale as 'sl' | 'de' | 'it'];
    let result = locale === 'en' ? message : messages[message]?.[index] ?? message;
    for (const [key, value] of Object.entries(values)) result = result.replaceAll(`{${key}}`, String(value));
    return result;
  };
}

// Translate display fields only: never IDs, URLs, evidence, source assets or bed mechanics.
export function translatedProperty(property: Property, locale: Locale): Property {
  const t = translator(locale);
  const photo = (p: PropertyPhoto): PropertyPhoto => ({ ...p, alt: p.alt ? t(p.alt) : '' });
  const result = structuredClone(property);
  result.description = t(result.description);
  if (result.country) result.country = t(result.country);
  result.amenities = result.amenities.map(a => t(a));
  result.photos = result.photos.map(photo);
  result.units = result.units.map(u => {
    u.slug = unitSlug(u);
    u.name = t(u.name);
    if (u.description) u.description = t(u.description);
    if (u.occupancyLabel) u.occupancyLabel = t(u.occupancyLabel);
    u.amenities = u.amenities.map(a => t(a));
    u.rooms = u.rooms.map(r => ({ ...r, name: t(r.name) }));
    u.photos = u.photos.map(photo);
    return u;
  });
  const story = result.narrative;
  if (story) {
    for (const key of ['heroTitle', 'heroText', 'introTitle', 'introText', 'hostQuote', 'hostText'] as const) story[key] = t(story[key]);
    if (story.heroEyebrow) story.heroEyebrow = t(story.heroEyebrow);
    if (story.locationText) story.locationText = t(story.locationText);
    story.practical.forEach(p => { p.label = t(p.label); p.value = t(p.value); });
    story.highlights?.forEach(h => { h.title = t(h.title); h.text = t(h.text); });
  }
  if (result.bookingRating) {
    result.bookingRating.label = t(result.bookingRating.label);
    result.bookingRating.categories.forEach(c => { c.label = t(c.label); });
  }
  // Guest quotes stay verbatim in their original language, including the hero excerpt.
  result.testimonials?.forEach(r => { if (r.country) r.country = t(r.country); });
  result.nearby?.forEach(p => { p.name = t(p.name); p.distance = t(p.distance); if (p.note) p.note = t(p.note); });
  if (result.host) result.host.languages = result.host.languages.map(l => t(l));
  return result;
}
export function translatedBeds(beds: string, locale: Locale): string {
  return beds.split(' · ').map(b => translator(locale)(b)).join(' · ');
}
