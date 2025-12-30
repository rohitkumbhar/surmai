import { ConversionRate } from '../../../types/expenses.ts';
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

export const searchPlaces = (query: string, page: number = 1, itemsPerPage: number = 20) => {
  return pb.collection('places').getList(page, itemsPerPage, {
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

// Returns the list of conversion rates for the specified currency
// The rates are based of USD
export const getCurrencyConversionRates = async (currencies: string[]) => {
  const condition = currencies.map((code) => `currencyCode = '${code.toUpperCase()}'`).join(' || ');
  const res = await pb.collection('currency_conversions').getList(1, currencies.length, {
    filter: `(${condition})`,
  });
  return res.items as unknown as ConversionRate[];
};
