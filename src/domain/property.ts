export type PropertyPhoto = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  srcSet?: string;
};

export type PropertyRoom = {
  name: string;
  description?: string;
  sleeps?: number;
  beds?: string;
};

export type PropertyPrice = {
  /** Display-ready reviewed rate text, for example "From €120 / night". */
  label: string;
  /** Optional short condition text, for example "seasonal; check Booking.com for live availability". */
  note?: string;
};

export type PropertyUnit = {
  id: string;
  /** Stable English URL slug, retained in translated views. */
  slug?: string;
  name: string;
  type?: string;
  description?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSquareMetres?: number;
  rooms: PropertyRoom[];
  amenities: string[];
  photos: PropertyPhoto[];
  bookingUrl?: string;
  occupancyLabel?: string;
  /** Reviewed display price. Never inferred from live availability. */
  price?: string | PropertyPrice;
  priceNote?: string;
};

export type Property = {
  name: string;
  type?: string;
  description: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  photos: PropertyPhoto[];
  amenities: string[];
  units: PropertyUnit[];
  /** Legacy single-unit fields, accepted while saved data is migrated on read. */
  rooms?: PropertyRoom[];
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSquareMetres?: number;
  checkIn?: string;
  checkOut?: string;
  bookingUrl: string;
  contact?: { email?: string; phone?: string };
  canonicalUrl?: string;
  translations?: Partial<Record<string, PropertyTranslation>>;
  /** Booking.com score (out of 10), copied from the listing. Not added to structured data: self-served ratings are ignored. */
  bookingRating?: { value: number; label: string; count: number; url: string; categories: Array<{ label: string; value: number }> };
  /** Verbatim guest reviews, first name and country as published. */
  testimonials?: Array<{ quote: string; author: string; country?: string; source: string }>;
  host?: { name: string; languages: string[] };
  /** Places near the property; distances as published by the source. */
  nearby?: Array<{ name: string; distance: string; note?: string; major?: boolean }>;
  narrative?: {
    heroTitle: string; heroText: string; introTitle: string; introText: string;
    hostName: string; hostQuote: string; hostText: string;
    practical: Array<{ label: string; value: string }>;
    heroEyebrow?: string;
    /** Verbatim excerpt from one of the testimonials, shown in the hero. */
    heroQuote?: { quote: string; author: string; country?: string };
    highlights?: Array<{ title: string; text: string }>;
    housePhotos?: string[];
    locationText?: string;
  };
};

export type PropertyTranslation = {
  name?: string;
  type?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  amenities?: string[];
  photoAlts?: string[];
  units?: Record<string, {
    name?: string;
    type?: string;
    description?: string;
    amenities?: string[];
    photoAlts?: string[];
    price?: string | PropertyPrice;
    priceNote?: string;
    rooms?: Array<{ name?: string; description?: string; beds?: string }>;
  }>;
};

export function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const unitsValid = item.units === undefined || (Array.isArray(item.units)
    && item.units.length > 0
    && item.units.every(isPropertyUnit)
    && new Set(item.units.map((unit) => (unit as PropertyUnit).id)).size === item.units.length);
  return typeof item.name === 'string' && item.name.trim().length > 0
    && typeof item.description === 'string'
    && typeof item.bookingUrl === 'string'
    && Array.isArray(item.photos)
    && Array.isArray(item.amenities)
    && unitsValid;
}

export function isPropertyUnit(value: unknown): value is PropertyUnit {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const optionalPositive = (field: string, allowZero = false) => item[field] === undefined
    || (typeof item[field] === 'number' && Number.isFinite(item[field]) && (allowZero ? item[field] >= 0 : item[field] > 0));
  return typeof item.id === 'string' && item.id.trim().length > 0
    && typeof item.name === 'string' && item.name.trim().length > 0
    && Array.isArray(item.rooms)
    && Array.isArray(item.amenities)
    && Array.isArray(item.photos)
    && optionalPositive('maxGuests')
    && optionalPositive('bedrooms', true)
    && optionalPositive('bathrooms', true)
    && optionalPositive('areaSquareMetres');
}

export function normalizeProperty(property: Property): Property {
  if (property.units?.length) return property;
  const unit: PropertyUnit = {
    id: 'default-unit',
    name: property.type ?? property.name,
    ...(property.type ? { type: property.type } : {}),
    ...(property.maxGuests !== undefined ? { maxGuests: property.maxGuests } : {}),
    ...(property.bedrooms !== undefined ? { bedrooms: property.bedrooms } : {}),
    ...(property.bathrooms !== undefined ? { bathrooms: property.bathrooms } : {}),
    ...(property.areaSquareMetres !== undefined ? { areaSquareMetres: property.areaSquareMetres } : {}),
    rooms: property.rooms ?? [],
    amenities: [],
    photos: [],
    bookingUrl: property.bookingUrl,
  };
  return { ...property, units: [unit] };
}

/** "60 m² · 4 adults · 1 extra-large double bed · 2 single beds" */
export function unitFacts(unit: PropertyUnit): string {
  return [
    unit.areaSquareMetres && `${unit.areaSquareMetres} m²`,
    unit.occupancyLabel,
    formatBeds(unit.rooms.map((room) => room.beds).filter(Boolean).join(' · ')),
  ].filter(Boolean).join(' · ');
}

/** "1 double bed · 1 double bed" → "2 double beds". Unparseable text is returned as is. */
export function formatBeds(beds: string): string {
  const counts = new Map<string, number>();
  for (const part of beds.split(' · ').filter(Boolean)) {
    const match = part.trim().match(/^(\d+)\s+(.+?)s?$/);
    if (!match) return beds;
    counts.set(match[2]!, (counts.get(match[2]!) ?? 0) + Number(match[1]));
  }
  return [...counts].map(([bed, count]) => `${count} ${bed}${count > 1 ? 's' : ''}`).join(' · ');
}

export function propertyLocation(property: Property, { country = true } = {}): string {
  // Addresses often end with the postcode and city already ("…, 4260 Bled").
  const city = property.city && property.address?.includes(property.city) ? undefined : property.city;
  return [property.address, city, country ? property.country : undefined].filter(Boolean).join(', ');
}

export function propertyMetaDescription(property: Property): string {
  const location = [property.city, property.country].filter(Boolean).join(', ');
  const text = `${property.name}${location ? ` — ${location}` : ''}. ${property.description}`;
  return text.replace(/\s+/g, ' ').trim().slice(0, 158);
}

export function localizeProperty(property: Property, locale: string): Property {
  const translation = property.translations?.[locale];
  if (!translation) return property;
  const localizePhoto = (photo: PropertyPhoto, alt: string | undefined): PropertyPhoto => alt ? { ...photo, alt } : photo;
  const photos = property.photos.map((photo, index) => localizePhoto(photo, translation.photoAlts?.[index] ?? photo.alt));
  const units = property.units.map((unit) => {
    const translated = translation.units?.[unit.id];
    if (!translated) return unit;
    return {
      ...unit,
      ...translated,
      photos: unit.photos.map((photo, index) => localizePhoto(photo, translated.photoAlts?.[index] ?? photo.alt)),
      rooms: unit.rooms.map((room, index) => ({ ...room, ...translated.rooms?.[index] })),
    };
  });
  return { ...property, ...translation, photos, units };
}
