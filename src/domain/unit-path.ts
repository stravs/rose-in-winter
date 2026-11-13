import { localePath, type Locale } from '../i18n';

type UnitRef = { id: string; name: string };

/** Readable URL from the apartment name, e.g. "two-bedroom-apartment-with-garden-view". */
export function unitSlug(unit: UnitRef): string {
  const slug = unit.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `unit-${Array.from(new TextEncoder().encode(unit.id), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
export function unitPath(unit: UnitRef, locale: Locale): string {
  return localePath(locale, `/units/${unitSlug(unit)}/`);
}
