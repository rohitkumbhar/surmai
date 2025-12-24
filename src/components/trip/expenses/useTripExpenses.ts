import { useQuery } from '@tanstack/react-query';
import { getCurrencyConversionRates, listExpenses } from '../../../lib/api';
import { ConversionRate } from '../../../types/expenses';
import { convertExpenses, getExpenseTotalsByCurrency } from './helper';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import { Expense, Trip } from '../../../types/trips';

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

  return {
    expenseRecords: rawExpenses,
    currencyCodes,
    conversionRates: rates,
    convertedExpenses: expenses,
    totalsByCurrency,
    isLoading: conversionRatesLoading || expenseRecordsLoading,
  };
};
