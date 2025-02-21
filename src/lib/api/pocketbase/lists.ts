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

export const loadAirlines = () => {
  return pbAdmin.send('/load-airline-data', {
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

export const countAirlines = async () => {
  const { totalItems } = await pb.collection('airlines').getList(1, 1);
  return totalItems;
};

export const getTimezone = (latitude: string, longitude: string): Promise<string> => {
  return pb
    .send('/get-timezone', {
      method: 'GET',
      query: { latitude: latitude, longitude: longitude },
    })
    .then((result) => result.value);
};

export const searchPlaces = (query: string) => {
  return pb.collection('places').getList(1, 20, {
    filter: `name~"${query}" || asciiName~"${query}"`,
  });
};

export const searchAirports = (query: string) => {
  return pb.collection('airports').getList(1, 10, {
    filter: `(name~"${query}" || iataCode~"${query}")`,
  });
};

export const searchAirlines = (query: string) => {
  return pb.collection('airlines').getList(1, 10, {
    filter: `name~"${query}"`,
  });
};
