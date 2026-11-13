import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@tests/unit/helpers/queryClient';

import type { Activity, Expense, Lodging, Transportation, Trip } from '@src/types/trips';

const listTripsByYear = vi.fn();
const listTransportationsByYear = vi.fn();
const listLodgingsByYear = vi.fn();
const listExpensesByYear = vi.fn();
const listActivitiesByYear = vi.fn();
const getCurrencyConversionRates = vi.fn();

vi.mock('@src/lib/api', () => ({
  listTripsByYear: (...args: unknown[]) => listTripsByYear(...args),
  listTransportationsByYear: (...args: unknown[]) => listTransportationsByYear(...args),
  listLodgingsByYear: (...args: unknown[]) => listLodgingsByYear(...args),
  listExpensesByYear: (...args: unknown[]) => listExpensesByYear(...args),
  listActivitiesByYear: (...args: unknown[]) => listActivitiesByYear(...args),
  getCurrencyConversionRates: (...args: unknown[]) => getCurrencyConversionRates(...args),
}));

const currentUser: { user: { currencyCode?: string } | undefined } = { user: { currencyCode: 'USD' } };
vi.mock('@src/auth/useCurrentUser', () => ({
  useCurrentUser: () => currentUser,
}));

const { useTravelBoardStatistics } = await import('@src/pages/TravelBoard/useTravelBoardStatistics');

const paris = { id: 'paris', name: 'Paris', latitude: '48.85', longitude: '2.35' };
const tokyo = { id: 'tokyo', name: 'Tokyo', latitude: '35.68', longitude: '139.65' };

const aTrip = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 't1',
    name: 'Trip',
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    destinations: [],
    ...overrides,
  }) as unknown as Trip;

const renderStats = async (year = '2026') => {
  const rendered = renderHook(() => useTravelBoardStatistics(year), { wrapper: withQueryClient() });
  await waitFor(() => expect(rendered.result.current.stats).not.toBeNull());
  return rendered;
};

beforeEach(() => {
  vi.clearAllMocks();
  currentUser.user = { currencyCode: 'USD' };
  listTripsByYear.mockResolvedValue([]);
  listTransportationsByYear.mockResolvedValue([]);
  listLodgingsByYear.mockResolvedValue([]);
  listExpensesByYear.mockResolvedValue([]);
  listActivitiesByYear.mockResolvedValue([]);
  getCurrencyConversionRates.mockResolvedValue([{ currencyCode: 'USD', conversionRate: 1 }]);
});

describe('with no trips', () => {
  it('reports zeroes rather than nothing', async () => {
    const { result } = await renderStats();

    expect(result.current.stats).toMatchObject({
      totalTrips: 0,
      totalDestinations: 0,
      totalDays: 0,
      totalNights: 0,
      totalExpenseAmount: 0,
      totalActivities: 0,
      avgActivitiesPerTrip: 0,
      markers: [],
    });
  });
});

describe('trip totals', () => {
  it('counts days inclusively', async () => {
    listTripsByYear.mockResolvedValue([aTrip({ startDate: '2026-06-01', endDate: '2026-06-05' })]);

    const { result } = await renderStats();

    // the 1st to the 5th is five days
    expect(result.current.stats?.totalDays).toBe(5);
    expect(result.current.stats?.totalTrips).toBe(1);
  });

  it('counts a single day trip as one day', async () => {
    listTripsByYear.mockResolvedValue([aTrip({ startDate: '2026-06-01', endDate: '2026-06-01' })]);

    const { result } = await renderStats();

    expect(result.current.stats?.totalDays).toBe(1);
  });

  it('counts each destination once across trips', async () => {
    listTripsByYear.mockResolvedValue([
      aTrip({ id: 't1', destinations: [paris, tokyo] }),
      aTrip({ id: 't2', destinations: [paris] }),
    ]);

    const { result } = await renderStats();

    expect(result.current.stats?.totalDestinations).toBe(2);
  });

  it('puts one map marker on each destination that has coordinates', async () => {
    listTripsByYear.mockResolvedValue([
      aTrip({ id: 't1', name: 'First', destinations: [paris, tokyo] }),
      aTrip({ id: 't2', name: 'Second', destinations: [paris] }),
      aTrip({ id: 't3', name: 'Third', destinations: [{ id: 'nowhere', name: 'Nowhere' }] }),
    ]);

    const { result } = await renderStats();

    expect(result.current.stats?.markers).toHaveLength(2);
    expect(result.current.stats?.markers.map((m) => m.place.id)).toEqual(['paris', 'tokyo']);
    expect(result.current.stats?.markers[0].tripName).toBe('First');
  });
});

describe('transport totals', () => {
  it('counts journeys by mode', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listTransportationsByYear.mockResolvedValue([
      { id: 'tr1', type: 'flight', departureTime: '2026-06-01T10:00:00', arrivalTime: '2026-06-01T12:00:00' },
      { id: 'tr2', type: 'flight', departureTime: '2026-06-02T10:00:00', arrivalTime: '2026-06-02T11:30:00' },
      { id: 'tr3', type: 'train', departureTime: '2026-06-03T09:00:00', arrivalTime: '2026-06-03T10:00:00' },
    ] as unknown as Transportation[]);

    const { result } = await renderStats();

    expect(result.current.stats?.transCounts).toEqual({ flight: 2, train: 1 });
    expect(result.current.stats?.totalTransTimeMinutes).toBe(120 + 90 + 60);
    expect(result.current.stats?.transTimeByMode).toEqual({ flight: 210, train: 60 });
  });

  // Regression for #369: departure and arrival are local times at each end, so
  // the time zone change has to come out of the duration.
  it('takes time zones into account', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listTransportationsByYear.mockResolvedValue([
      {
        id: 'tr1',
        type: 'flight',
        departureTime: '2026-06-01T18:00:00',
        arrivalTime: '2026-06-02T07:00:00',
        metadata: {
          origin: { timezone: 'America/New_York' },
          destination: { timezone: 'Europe/Paris' },
        },
      },
    ] as unknown as Transportation[]);

    const { result } = await renderStats();

    // 18:00 in New York to 07:00 in Paris the next day is seven hours
    expect(result.current.stats?.totalTransTimeMinutes).toBe(420);
  });

  it('ignores a journey that arrives before it departs', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listTransportationsByYear.mockResolvedValue([
      { id: 'tr1', type: 'flight', departureTime: '2026-06-01T12:00:00', arrivalTime: '2026-06-01T10:00:00' },
    ] as unknown as Transportation[]);

    const { result } = await renderStats();

    expect(result.current.stats?.totalTransTimeMinutes).toBe(0);
    // the journey is still counted, only its duration is dropped
    expect(result.current.stats?.transCounts).toEqual({ flight: 1 });
    expect(result.current.stats?.transTimeByMode).toEqual({});
  });
});

describe('lodging totals', () => {
  // Regression for #368: nights are the calendar days crossed.
  it('counts nights by calendar day', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listLodgingsByYear.mockResolvedValue([
      { id: 'l1', type: 'hotel', startDate: '2026-06-01T15:00:00', endDate: '2026-06-04T11:00:00' },
      { id: 'l2', type: 'home', startDate: '2026-06-04T18:00:00', endDate: '2026-06-05T09:00:00' },
    ] as unknown as Lodging[]);

    const { result } = await renderStats();

    // three calendar days, then one overnight stay
    expect(result.current.stats?.totalNights).toBe(4);
    expect(result.current.stats?.lodgingNightsByType).toEqual({ hotel: 3, home: 1 });
    expect(result.current.stats?.lodgingCountsByType).toEqual({ hotel: 1, home: 1 });
    expect(result.current.stats?.totalLodgings).toBe(2);
  });

  it('files a stay without a type under other', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listLodgingsByYear.mockResolvedValue([
      { id: 'l1', startDate: '2026-06-01T15:00:00', endDate: '2026-06-02T11:00:00' },
    ] as unknown as Lodging[]);

    const { result } = await renderStats();

    expect(result.current.stats?.lodgingCountsByType).toEqual({ other: 1 });
  });
});

describe('expense totals', () => {
  // Regression for #363: the headline total is in the converted currency.
  it('converts into the user currency and keeps the original amounts', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listExpensesByYear.mockResolvedValue([
      { id: 'e1', name: 'Hotel', cost: { value: 90, currency: 'EUR' } },
      { id: 'e2', name: 'Dinner', cost: { value: 50, currency: 'USD' } },
    ] as unknown as Expense[]);
    getCurrencyConversionRates.mockResolvedValue([
      { currencyCode: 'USD', conversionRate: 1 },
      { currencyCode: 'EUR', conversionRate: 0.9 },
    ]);

    const { result } = await renderStats();

    await waitFor(() => expect(result.current.stats?.numCurrencies).toBe(2));

    // 90 EUR is 100 USD, plus 50 USD
    expect(result.current.stats?.totalExpenseAmount).toBeCloseTo(150, 2);
    expect(result.current.stats?.userCurrency).toBe('USD');
    expect(result.current.stats?.totalsByCurrency).toEqual({ EUR: 90, USD: 50 });
  });

  it('asks for the rates of every currency in use', async () => {
    listTripsByYear.mockResolvedValue([aTrip()]);
    listExpensesByYear.mockResolvedValue([
      { id: 'e1', name: 'Hotel', cost: { value: 90, currency: 'EUR' } },
    ] as unknown as Expense[]);
    listLodgingsByYear.mockResolvedValue([
      { id: 'l1', type: 'hotel', startDate: '2026-06-01', endDate: '2026-06-02', cost: { value: 10, currency: 'GBP' } },
    ] as unknown as Lodging[]);

    await renderStats();

    await waitFor(() => expect(getCurrencyConversionRates).toHaveBeenCalled());
    const requested = getCurrencyConversionRates.mock.calls.at(-1)?.[0] as string[];
    expect(requested).toContain('USD');
    expect(requested).toContain('EUR');
    expect(requested).toContain('GBP');
  });

  it('falls back to USD when the user has no currency set', async () => {
    currentUser.user = {};
    listTripsByYear.mockResolvedValue([aTrip()]);

    const { result } = await renderStats();

    expect(result.current.stats?.userCurrency).toBe('USD');
    expect(result.current.stats?.isDefaultCurrency).toBe(true);
  });
});

describe('activity totals', () => {
  it('averages activities over the trips', async () => {
    listTripsByYear.mockResolvedValue([aTrip({ id: 't1' }), aTrip({ id: 't2' })]);
    listActivitiesByYear.mockResolvedValue([
      { id: 'a1', name: 'Louvre' },
      { id: 'a2', name: 'Orsay' },
      { id: 'a3', name: 'Eiffel Tower' },
    ] as unknown as Activity[]);

    const { result } = await renderStats();

    await waitFor(() => expect(result.current.stats?.totalActivities).toBe(3));
    expect(result.current.stats?.avgActivitiesPerTrip).toBeCloseTo(1.5, 5);
  });
});

describe('without a year', () => {
  it('does not ask for anything', () => {
    renderHook(() => useTravelBoardStatistics(null), { wrapper: withQueryClient() });

    expect(listTripsByYear).not.toHaveBeenCalled();
  });
});
