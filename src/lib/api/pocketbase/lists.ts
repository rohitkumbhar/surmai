import { pb, pbAdmin } from './pocketbase.ts';

export const loadDataset = (name: string) => {
  return pbAdmin.send('/api/surmai/settings/datasets', {
    method: 'POST',
    body: { name },
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
};

export const loadCities = () => {
  return loadDataset('places');
};

export const loadAirports = () => {
  return loadDataset('airports');
};

export const loadAirlines = () => {
  return loadDataset('airlines');
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

export const searchPlaces = (query: string) => {
  return pb.collection('places').getList(1, 20, {
    filter: `name~"${query}" || asciiName~"${query}"`,
  });
};

export const searchAirports = async (query: string) => {
  const result = await pb.collection('airports').getList(1, 10, {
    filter: `iataCode="${query.toUpperCase()}"`,
  });
  if (result.items.length === 1) {
    return result;
  }

  return await pb.collection('airports').getList(1, 10, {
    filter: `name~"${query}"`,
  });
};

export const searchAirlines = (query: string) => {
  return pb.collection('airlines').getList(1, 10, {
    filter: `name~"${query}"`,
  });
};
