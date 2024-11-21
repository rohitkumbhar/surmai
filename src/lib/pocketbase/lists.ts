import { pb, pbAdmin } from './pocketbase.ts';

export const loadCities = () => {
  return pbAdmin.send('/load-city-data', {
    method: 'POST',
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
};

export const countCities = async () => {
  const { totalItems } = await pb.collection('cities').getList(1, 1);
  return totalItems;
};

export const countAirports = async () => {
  const { totalItems } = await pb.collection('airports').getList(1, 1);
  return totalItems;
};

export const searchCities = (query: string) => {
  return pb.collection('cities').getList(1, 10, {
    filter: `name~"${query}"`,
  });
};
