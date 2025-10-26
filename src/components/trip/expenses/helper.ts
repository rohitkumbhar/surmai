import { type User } from '../../../types/auth';
import { type ConversionRate } from '../../../types/expenses';
import { type ConvertedExpense, type Expense, type Trip } from '../../../types/trips';

export const convertExpenses = (
  user: User | undefined,
  trip: Trip,
  expenses: Expense[],
  rates: ConversionRate[]
): ConvertedExpense[] => {
  const budgetCurrencyCode = trip.budget?.currency || user?.currencyCode || 'USD';
  const budgetCurrencyConversionRate = rates.find((r) => r.currencyCode === budgetCurrencyCode);

  return expenses.map((e) => {
    const expenseCurrencyCode = e.cost?.currency || trip.budget?.currency || user?.currencyCode || 'USD';
    const conversionRate = rates.find((r) => r.currencyCode === expenseCurrencyCode);
    const expenseValueInUSD = (e.cost?.value || 0) / (conversionRate?.conversionRate || 1);
    const expenseInBudgetCurrency = expenseValueInUSD * (budgetCurrencyConversionRate?.conversionRate || 1);

    return {
      ...e,
      convertedCost: {
        currency: budgetCurrencyCode,
        value: parseFloat(expenseInBudgetCurrency.toFixed(2)),
      },
    };
  });
};

export const getExpenseTotalsByCurrency = (user: User | undefined, trip: Trip, expenses: ConvertedExpense[]) => {
  return expenses.reduce((acc: { [key: string]: { total: number; convertedTotal: number } }, e: ConvertedExpense) => {
    const currencyCode = e.cost?.currency || trip.budget?.currency || user?.currencyCode || 'USD';
    const total = (acc[currencyCode]?.total || 0) + (e.cost?.value || 0);
    const convertedTotal = (acc[currencyCode]?.convertedTotal || 0) + (e.convertedCost?.value || 0);
    return {
      ...acc,
      [currencyCode]: {
        total,
        convertedTotal,
      },
    };
  }, {});
};

const currencyColors = new Map([
  ['USD', '#4CAF50'], // Green - US Dollar
  ['EUR', '#2196F3'], // Blue - Euro
  ['GBP', '#9C27B0'], // Purple - British Pound
  ['JPY', '#FFC107'], // Amber - Japanese Yen
  ['AUD', '#FF9800'], // Orange - Australian Dollar
  ['CAD', '#00BCD4'], // Cyan - Canadian Dollar
  ['CHF', '#8BC34A'], // Light Green - Swiss Franc
  ['CNY', '#F44336'], // Red - Chinese Yuan
  ['INR', '#3F51B5'], // Indigo - Indian Rupee
  ['SGD', '#009688'], // Teal - Singapore Dollar
  ['NZD', '#FF5722'], // Deep Orange - New Zealand Dollar
  ['SEK', '#795548'], // Brown - Swedish Krona
  ['NOK', '#607D8B'], // Blue Grey - Norwegian Krone
  ['KRW', '#E91E63'], // Pink - South Korean Won
  ['ZAR', '#CDDC39'], // Lime - South African Rand
]);

export const getRandomColor = (code: string) => {
  if (currencyColors.get(code)) {
    return currencyColors.get(code);
  }

  // Simple hash of string → integer
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map hash to hue (0–360)
  const hue = Math.abs(hash) % 360;

  // Fixed saturation & lightness for consistent appearance
  const saturation = 60; // 0–100%
  const lightness = 50; // 0–100%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
