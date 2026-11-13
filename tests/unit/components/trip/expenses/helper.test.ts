import { describe, expect, it } from 'vitest';

import {
  convertExpenses,
  formatCost,
  getExpenseTotalsByCurrency,
  getRandomColor,
  getTargetCurrency,
} from '@src/components/trip/expenses/helper';

import type { User } from '@src/types/auth';
import type { ConversionRate } from '@src/types/expenses';
import type { Expense, Trip } from '@src/types/trips';

// Rates are stored against USD: one USD buys this many of the currency.
const rates: ConversionRate[] = [
  { currencyCode: 'USD', conversionRate: 1 },
  { currencyCode: 'EUR', conversionRate: 0.9 },
  { currencyCode: 'GBP', conversionRate: 0.8 },
] as ConversionRate[];

const user = (currencyCode?: string) => ({ currencyCode }) as User;
const trip = (budgetCurrency?: string) =>
  ({ budget: budgetCurrency ? { currency: budgetCurrency, value: 0 } : undefined }) as Trip;
const expense = (value: number, currency?: string) =>
  ({ id: `e-${value}-${currency}`, name: 'item', trip: 'trip-1', cost: { value, currency } }) as Expense;

describe('getTargetCurrency', () => {
  it("prefers the trip's budget currency", () => {
    expect(getTargetCurrency(user('GBP'), trip('EUR'))).toBe('EUR');
  });

  it("falls back to the user's currency when the trip has no budget", () => {
    expect(getTargetCurrency(user('GBP'), trip())).toBe('GBP');
  });

  it('falls back to USD when neither is set', () => {
    expect(getTargetCurrency(user(), trip())).toBe('USD');
    expect(getTargetCurrency(undefined, trip())).toBe('USD');
  });
});

describe('convertExpenses', () => {
  it('converts into the budget currency via USD', () => {
    // 90 EUR is 100 USD, which is 80 GBP
    const [converted] = convertExpenses(user(), trip('GBP'), [expense(90, 'EUR')], rates);

    expect(converted.convertedCost).toEqual({ currency: 'GBP', value: 80 });
  });

  it('leaves an expense already in the budget currency alone', () => {
    const [converted] = convertExpenses(user(), trip('EUR'), [expense(42.5, 'EUR')], rates);

    expect(converted.convertedCost).toEqual({ currency: 'EUR', value: 42.5 });
  });

  it('rounds to two decimal places', () => {
    const [converted] = convertExpenses(user(), trip('GBP'), [expense(10, 'EUR')], rates);

    // 10 / 0.9 * 0.8 = 8.888...
    expect(converted.convertedCost?.value).toBe(8.89);
  });

  it('keeps the original cost untouched', () => {
    const [converted] = convertExpenses(user(), trip('GBP'), [expense(90, 'EUR')], rates);

    expect(converted.cost).toEqual({ value: 90, currency: 'EUR' });
  });

  it('treats an expense without a currency as being in the budget currency', () => {
    const [converted] = convertExpenses(user(), trip('EUR'), [expense(50)], rates);

    expect(converted.convertedCost).toEqual({ currency: 'EUR', value: 50 });
  });

  it('leaves amounts unchanged when a rate is missing', () => {
    const [converted] = convertExpenses(user(), trip('JPY'), [expense(100, 'SEK')], rates);

    expect(converted.convertedCost).toEqual({ currency: 'JPY', value: 100 });
  });

  it('treats a missing amount as zero', () => {
    const [converted] = convertExpenses(user(), trip('EUR'), [{ id: 'e1', name: 'free', trip: 'trip-1' } as Expense], rates);

    expect(converted.convertedCost?.value).toBe(0);
  });

  it('returns an entry for every expense', () => {
    const converted = convertExpenses(
      user(),
      trip('USD'),
      [expense(10, 'EUR'), expense(20, 'GBP'), expense(30, 'USD')],
      rates
    );

    expect(converted).toHaveLength(3);
  });

  it('handles an empty list', () => {
    expect(convertExpenses(user(), trip('USD'), [], rates)).toEqual([]);
  });
});

describe('getExpenseTotalsByCurrency', () => {
  it('groups totals by the original currency', () => {
    const expenses = convertExpenses(
      user(),
      trip('USD'),
      [expense(90, 'EUR'), expense(10, 'EUR'), expense(80, 'GBP')],
      rates
    );

    const totals = getExpenseTotalsByCurrency(user(), trip('USD'), expenses);

    expect(totals.EUR.total).toBe(100);
    expect(totals.GBP.total).toBe(80);
    // 100 EUR is 111.11 USD, 80 GBP is 100 USD
    expect(totals.EUR.convertedTotal).toBeCloseTo(111.11, 2);
    expect(totals.GBP.convertedTotal).toBe(100);
  });

  it('groups expenses without a currency under the budget currency', () => {
    const expenses = convertExpenses(user(), trip('EUR'), [expense(25)], rates);

    expect(getExpenseTotalsByCurrency(user(), trip('EUR'), expenses).EUR.total).toBe(25);
  });

  it('returns nothing for an empty list', () => {
    expect(getExpenseTotalsByCurrency(user(), trip('USD'), [])).toEqual({});
  });
});

describe('getRandomColor', () => {
  it('uses the fixed colour for a known currency', () => {
    expect(getRandomColor('USD')).toBe('#4CAF50');
    expect(getRandomColor('EUR')).toBe('#2196F3');
  });

  it('derives a stable colour for anything else', () => {
    expect(getRandomColor('XYZ')).toBe(getRandomColor('XYZ'));
    expect(getRandomColor('XYZ')).toMatch(/^hsl\(\d+, 60%, 50%\)$/);
  });

  it('gives different currencies different colours', () => {
    expect(getRandomColor('AAA')).not.toBe(getRandomColor('BBB'));
  });
});

describe('formatCost', () => {
  it('formats an amount in its currency', () => {
    // the exact symbol placement depends on the runtime locale
    expect(formatCost({ value: 1234.5, currency: 'USD' })).toContain('1,234.5');
  });

  it('returns an empty string when there is no cost', () => {
    expect(formatCost(undefined)).toBe('');
  });
});
