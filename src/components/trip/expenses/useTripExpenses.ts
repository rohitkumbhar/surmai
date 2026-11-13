import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@src/auth/useCurrentUser';
import { convertExpenses, getExpenseTotalsByCurrency, getTargetCurrency } from '@src/components/trip/expenses/helper';
import { getCurrencyConversionRates, listExpenses } from '@src/lib/api';

import type { ConversionRate } from '@src/types/expenses';
import type { Expense, Trip } from '@src/types/trips';

export const useTripExpenses = ({ trip }: { trip: Trip }) => {
  const { user } = useCurrentUser();
  const { data: rawExpenses, isLoading: expenseRecordsLoading } = useQuery<Expense[]>({
    queryKey: ['listExpenses', trip.id],
    queryFn: () => listExpenses(trip.id),
  });

  const expenseCurrencies = rawExpenses?.map((e) => e.cost?.currency || 'USD');
  const currencyCodes = new Set([
    trip.budget?.currency || 'USD',
    user?.currencyCode || 'USD',
    ...(expenseCurrencies || []),
  ]);
  const { data: rates, isLoading: conversionRatesLoading } = useQuery<ConversionRate[]>({
    queryKey: ['getCurrencyConversionRates', Array.from(currencyCodes)],
    queryFn: () => getCurrencyConversionRates(Array.from(currencyCodes)),
  });

  const expenses = convertExpenses(user, trip, rawExpenses || [], rates || []);
  const totalsByCurrency = getExpenseTotalsByCurrency(user, trip, expenses || []);
  const targetCurrency = getTargetCurrency(user, trip);

  return {
    expenseRecords: rawExpenses,
    currencyCodes,
    conversionRates: rates,
    convertedExpenses: expenses,
    totalsByCurrency,
    targetCurrency,
    isLoading: conversionRatesLoading || expenseRecordsLoading,
  };
};
