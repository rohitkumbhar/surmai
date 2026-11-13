import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { withQueryClient } from '../../../helpers/queryClient';

import type { Expense, Trip } from '@src/types/trips';

const listExpenses = vi.fn();
const getCurrencyConversionRates = vi.fn();

vi.mock('@src/lib/api', () => ({
  listExpenses: (...args: unknown[]) => listExpenses(...args),
  getCurrencyConversionRates: (...args: unknown[]) => getCurrencyConversionRates(...args),
}));

const currentUser: { user: { currencyCode?: string } | undefined } = { user: { currencyCode: 'USD' } };
vi.mock('@src/auth/useCurrentUser', () => ({
  useCurrentUser: () => currentUser,
}));

const { useTripExpenses } = await import('@src/components/trip/expenses/useTripExpenses');

const trip = (budgetCurrency = 'EUR') =>
  ({
    id: 't1',
    name: 'Paris',
    ownerId: 'u1',
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    budget: { currency: budgetCurrency, value: 1000 },
  }) as Trip;

const renderExpenses = async (tripRecord = trip()) => {
  const rendered = renderHook(() => useTripExpenses({ trip: tripRecord }), { wrapper: withQueryClient() });
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  return rendered;
};

beforeEach(() => {
  vi.clearAllMocks();
  currentUser.user = { currencyCode: 'USD' };
  listExpenses.mockResolvedValue([]);
  getCurrencyConversionRates.mockResolvedValue([
    { currencyCode: 'USD', conversionRate: 1 },
    { currencyCode: 'EUR', conversionRate: 0.9 },
    { currencyCode: 'GBP', conversionRate: 0.8 },
  ]);
});

it("reads the trip's expenses", async () => {
  await renderExpenses();

  expect(listExpenses).toHaveBeenCalledWith('t1');
});

it('converts into the budget currency', async () => {
  listExpenses.mockResolvedValue([
    { id: 'e1', name: 'Hotel', trip: 't1', cost: { value: 80, currency: 'GBP' } },
  ] as Expense[]);

  const { result } = await renderExpenses(trip('EUR'));

  expect(result.current.targetCurrency).toBe('EUR');
  // 80 GBP is 100 USD, which is 90 EUR
  expect(result.current.convertedExpenses[0].convertedCost).toEqual({ currency: 'EUR', value: 90 });
});

it('totals the original amounts by currency', async () => {
  listExpenses.mockResolvedValue([
    { id: 'e1', name: 'Hotel', trip: 't1', cost: { value: 80, currency: 'GBP' } },
    { id: 'e2', name: 'Dinner', trip: 't1', cost: { value: 45, currency: 'EUR' } },
  ] as Expense[]);

  const { result } = await renderExpenses(trip('EUR'));

  expect(result.current.totalsByCurrency.GBP.total).toBe(80);
  expect(result.current.totalsByCurrency.EUR.total).toBe(45);
  expect(result.current.totalsByCurrency.GBP.convertedTotal).toBe(90);
});

it('asks for the rates of the budget, user and expense currencies', async () => {
  listExpenses.mockResolvedValue([
    { id: 'e1', name: 'Hotel', trip: 't1', cost: { value: 80, currency: 'GBP' } },
  ] as Expense[]);

  await renderExpenses(trip('EUR'));

  await waitFor(() => {
    const requested = getCurrencyConversionRates.mock.calls.at(-1)?.[0] as string[];
    expect(requested).toContain('EUR');
    expect(requested).toContain('USD');
    expect(requested).toContain('GBP');
  });
});

it('reports loading until both queries settle', () => {
  listExpenses.mockReturnValue(new Promise(() => {}));
  getCurrencyConversionRates.mockReturnValue(new Promise(() => {}));

  const { result } = renderHook(() => useTripExpenses({ trip: trip() }), { wrapper: withQueryClient() });

  expect(result.current.isLoading).toBe(true);
});

it('returns no expenses rather than failing when there are none', async () => {
  const { result } = await renderExpenses();

  expect(result.current.convertedExpenses).toEqual([]);
  expect(result.current.totalsByCurrency).toEqual({});
});
