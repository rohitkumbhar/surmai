import { describe, expect, it } from 'vitest';

import { getMapsLink, getMapsUrl } from '../../../src/lib/places';

import type { User } from '../../../src/types/auth';
import type { Place } from '../../../src/types/trips';

const googleUser = { mapsProvider: 'google' } as User;
const paris = { id: 'paris', name: 'Paris', stateName: 'Île-de-France', countryName: 'France' } as Place;

describe('getMapsUrl', () => {
  it('builds a Google Maps place link when the user prefers Google', () => {
    const url = getMapsUrl(googleUser, paris);

    expect(url).toContain('https://www.google.com/maps/place/');
    expect(url).toContain('Paris');
    expect(url).toContain('France');
  });

  it('defaults to OpenStreetMap', () => {
    expect(getMapsUrl(undefined, paris)).toContain('https://www.openstreetmap.org/search?query=');
    expect(getMapsUrl({} as User, paris)).toContain('openstreetmap.org');
  });

  it('copes with a destination that has no state', () => {
    const place = { id: 'tokyo', name: 'Tokyo', countryName: 'Japan' } as Place;

    expect(getMapsUrl(googleUser, place)).toContain('Tokyo');
    expect(getMapsUrl(undefined, place)).toContain('Tokyo');
  });
});

describe('getMapsLink', () => {
  it('builds a Google Maps search when the user prefers Google', () => {
    expect(getMapsLink(googleUser, '12 Rue de Rivoli')).toBe(
      'https://www.google.com/maps/search/?api=1&query=12 Rue de Rivoli'
    );
  });

  it('defaults to OpenStreetMap', () => {
    expect(getMapsLink(undefined, '12 Rue de Rivoli')).toBe(
      'https://www.openstreetmap.org/search?query=12 Rue de Rivoli'
    );
  });
});
