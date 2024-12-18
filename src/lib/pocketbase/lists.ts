import { pb, pbAdmin } from './pocketbase.ts';

export const loadCities = () => {
  return pbAdmin.send('/load-city-data', {
    method: 'POST',
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
};

export const loadAirports = () => {
  return pbAdmin.send('/load-airport-data', {
    method: 'POST',
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
};

export const countPlaces = async () => {
  const { totalItems } = await pb.collection('places').getList(1, 1);
  return totalItems;
};

export const countAirports = async () => {
  const { totalItems } = await pb.collection('airports').getList(1, 1);
  return totalItems;
};

export const searchPlaces = (query: string) => {
  return pb.collection('places').getList(1, 20, {
    filter: `name~"${query}"`,
  });
};

export const searchAirports = (query: string) => {
  return pb.collection('airports').getList(1, 10, {
    filter: `(name~"${query}" || iataCode~"${query}")`,
  });
};
