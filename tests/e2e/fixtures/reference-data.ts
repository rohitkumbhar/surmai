import type { SurmaiApi } from '@tests/e2e/fixtures/api';

/**
 * A handful of places, airports and airlines for the tests to search.
 *
 * The real datasets hold hundreds of thousands of rows and take minutes to
 * load, which the suite used to wait out with a fixed sleep. Searching only
 * needs a few predictable rows.
 */
export const places = [
  {
    name: 'New York',
    asciiName: 'New York',
    stateCode: 'NY',
    stateName: 'New York',
    countryCode: 'US',
    countryName: 'United States',
    latitude: '40.71427',
    longitude: '-74.00597',
    timezone: 'America/New_York',
  },
  {
    name: 'Los Angeles',
    asciiName: 'Los Angeles',
    stateCode: 'CA',
    stateName: 'California',
    countryCode: 'US',
    countryName: 'United States',
    latitude: '34.05223',
    longitude: '-118.24368',
    timezone: 'America/Los_Angeles',
  },
  {
    name: 'Paris',
    asciiName: 'Paris',
    stateCode: 'IDF',
    stateName: 'Île-de-France',
    countryCode: 'FR',
    countryName: 'France',
    latitude: '48.85341',
    longitude: '2.3488',
    timezone: 'Europe/Paris',
  },
  {
    name: 'Tokyo',
    asciiName: 'Tokyo',
    stateCode: '13',
    stateName: 'Tokyo',
    countryCode: 'JP',
    countryName: 'Japan',
    latitude: '35.6895',
    longitude: '139.69171',
    timezone: 'Asia/Tokyo',
  },
];

export const airports = [
  {
    name: 'John F Kennedy International Airport',
    iataCode: 'JFK',
    isoCountry: 'US',
    latitude: '40.639801',
    longitude: '-73.7789',
    timezone: 'America/New_York',
  },
  {
    name: 'Los Angeles International Airport',
    iataCode: 'LAX',
    isoCountry: 'US',
    latitude: '33.942501',
    longitude: '-118.407997',
    timezone: 'America/Los_Angeles',
  },
  {
    name: 'Charles de Gaulle Airport',
    iataCode: 'CDG',
    isoCountry: 'FR',
    latitude: '49.012798',
    longitude: '2.55',
    timezone: 'Europe/Paris',
  },
];

export const airlines = [
  { name: 'American Airlines', code: 'AA' },
  { name: 'Air France', code: 'AF' },
  { name: 'Delta Air Lines', code: 'DL' },
];

/**
 * Inserts the fixtures, skipping any that are already there, so the suite can
 * be run repeatedly against the same backend.
 */
export async function seedReferenceData(api: SurmaiApi) {
  const seed = async (collection: string, rows: Record<string, unknown>[], key: string) => {
    const existing = await api.listRecords(collection);
    const seen = new Set(existing.items.map((item) => item[key] as string));

    for (const row of rows) {
      if (!seen.has(row[key] as string)) {
        await api.createRecord(collection, row);
      }
    }
  };

  await seed('places', places, 'name');
  await seed('airports', airports, 'iataCode');
  await seed('airlines', airlines, 'code');

  // The expense screens convert through these, so a couple of known rates keep
  // the totals predictable.
  const rates = [
    { currencyCode: 'USD', conversionRate: 1 },
    { currencyCode: 'EUR', conversionRate: 0.9 },
    { currencyCode: 'GBP', conversionRate: 0.8 },
  ];
  await seed('currency_conversions', rates, 'currencyCode');
}
