import { User } from '../types/auth.ts';
import { Place } from '../types/trips.ts';

export const getMapsUrl = (user: User | undefined, destination: Place): string => {
  if (user?.mapsProvider === 'google') {
    return `https://www.google.com/maps/place/${destination.name},${destination.stateName ? `+${destination.stateName},` : ''},${destination.countryName ? `+${destination.countryName}` : ''}`;
  }
  return `https://www.openstreetmap.org/search?query=${destination.name},${destination.stateName || ''},${destination.countryName}`;
};

export const getMapsLink = (user: User | undefined, address: string): string => {
  if (user?.mapsProvider === 'google') {
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  }
  return `https://www.openstreetmap.org/search?query=${address}`;
};
