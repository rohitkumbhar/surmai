import { User } from '../types/auth.ts';
import { Destination } from '../types/trips.ts';

export const getMapsUrl = (user: User | undefined, destination: Destination): string => {
  if (user?.mapsProvider === 'google') {
    return `https://www.google.com/maps/place/${destination.name},${destination.stateName ? `+${destination.stateName},` : ''},${destination.countryName ? `+${destination.countryName}` : ''}`;
  }
  return `https://www.openstreetmap.org/search?query=${destination.name},${destination.stateName || ''},${destination.countryName}`;
};
