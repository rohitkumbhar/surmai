import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { useCurrentUser } from '../../auth/useCurrentUser';
import { convertExpenses } from '../../components/trip/expenses/helper';
import {
  listTripsByYear,
  listTransportationsByYear,
  listLodgingsByYear,
  listExpensesByYear,
  listActivitiesByYear,
  getCurrencyConversionRates,
} from '../../lib/api';

import type { ConversionRate } from '../../types/expenses';
import type { Trip, Transportation, Lodging, Expense, Activity, Place } from '../../types/trips';

export const useTravelBoardStatistics = (year: string | null) => {
  const { user } = useCurrentUser();

  const { data: trips, isPending: tripsPending } = useQuery<Trip[]>({
    queryKey: ['trips', year],
    queryFn: () => listTripsByYear(year!),
    enabled: !!year,
  });

  const { data: transportations, isPending: transPending } = useQuery<Transportation[]>({
    queryKey: ['transportations', year],
    queryFn: () => listTransportationsByYear(year!),
    enabled: !!year,
  });

  const { data: lodgings, isPending: lodgingsPending } = useQuery<Lodging[]>({
    queryKey: ['lodgings', year],
    queryFn: () => listLodgingsByYear(year!),
    enabled: !!year,
  });

  const { data: expenses, isPending: expensesPending } = useQuery<Expense[]>({
    queryKey: ['expenses', year],
    queryFn: () => listExpensesByYear(year!),
    enabled: !!year,
  });

  const { data: activities, isPending: activitiesPending } = useQuery<Activity[]>({
    queryKey: ['activities', year],
    queryFn: () => listActivitiesByYear(year!),
    enabled: !!year,
  });

  const currencyCodes = useMemo(() => {
    const codes = new Set<string>();
    const userCurrency = user?.currencyCode || 'USD';
    codes.add(userCurrency);

    expenses?.forEach((e) => {
      if (e.cost?.currency) codes.add(e.cost.currency);
    });
    activities?.forEach((a) => {
      if (a.cost?.currency) codes.add(a.cost.currency);
    });
    transportations?.forEach((tr) => {
      if (tr.cost?.currency) codes.add(tr.cost.currency);
    });
    lodgings?.forEach((l) => {
      if (l.cost?.currency) codes.add(l.cost.currency);
    });
    return Array.from(codes);
  }, [user, expenses, activities, transportations, lodgings]);

  const { data: rates, isPending: ratesPending } = useQuery<ConversionRate[]>({
    queryKey: ['conversion_rates', currencyCodes],
    queryFn: () => getCurrencyConversionRates(currencyCodes),
    enabled: currencyCodes.length > 0,
  });

  const stats = useMemo(() => {
    if (!trips) return null;

    const totalTrips = trips.length;
    if (totalTrips === 0) {
      return {
        totalTrips: 0,
        totalDestinations: 0,
        totalDays: 0,
        totalExpenseAmount: 0,
        userCurrency: user?.currencyCode || 'USD',
        isDefaultCurrency: !user?.currencyCode,
        transCounts: {},
        totalTransTimeMinutes: 0,
        transTimeByMode: {},
        totalLodgings: 0,
        totalNights: 0,
        lodgingCountsByType: {},
        lodgingNightsByType: {},
        totalActivities: 0,
        avgActivitiesPerTrip: 0,
        numCurrencies: 0,
        totalsByCurrency: {},
        markers: [],
      };
    }

    const transCounts: Record<string, number> = {};
    let totalTransTimeMinutes = 0;
    const transTimeByMode: Record<string, number> = {};

    transportations?.forEach((tr) => {
      transCounts[tr.type] = (transCounts[tr.type] || 0) + 1;
      const duration = dayjs(tr.arrivalTime).diff(dayjs(tr.departureTime), 'minute');
      if (duration > 0) {
        totalTransTimeMinutes += duration;
        transTimeByMode[tr.type] = (transTimeByMode[tr.type] || 0) + duration;
      }
    });

    const totalLodgings = lodgings?.length || 0;
    let totalNights = 0;
    const lodgingCountsByType: Record<string, number> = {};
    const lodgingNightsByType: Record<string, number> = {};

    lodgings?.forEach((l) => {
      const type = l.type || 'other';
      lodgingCountsByType[type] = (lodgingCountsByType[type] || 0) + 1;
      const nights = Math.ceil(dayjs(l.endDate).diff(dayjs(l.startDate), 'day', true));
      if (nights > 0) {
        totalNights += nights;
        lodgingNightsByType[type] = (lodgingNightsByType[type] || 0) + nights;
      }
    });

    const userCurrency = user?.currencyCode || 'USD';
    const isDefaultCurrency = !user?.currencyCode;

    // Use helper for expense conversion
    const virtualTrip = { budget: { currency: userCurrency, value: 0 } } as Trip;
    const convertedExpenses = convertExpenses(user, virtualTrip, expenses || [], rates || []);

    let totalExpenseAmount = 0;
    const totalsByCurrency: Record<string, number> = {};
    const usedCurrencies = new Set<string>();

    convertedExpenses.forEach((e) => {
      totalExpenseAmount += e.convertedCost?.value || 0;
      const origCurrency = e.cost?.currency || 'USD';
      usedCurrencies.add(origCurrency);
      totalsByCurrency[origCurrency] = (totalsByCurrency[origCurrency] || 0) + (e.cost?.value || 0);
    });

    let totalDays = 0;
    const uniqueDestinations = new Set<string>();
    trips.forEach((trip) => {
      const days = dayjs(trip.endDate).diff(dayjs(trip.startDate), 'day') + 1;
      if (days > 0) totalDays += days;
      trip.destinations?.forEach((d) => uniqueDestinations.add(d.id));
    });

    // Map markers
    const markers: { place: Place; tripId: string; tripName: string }[] = [];
    const seenPlaces = new Set<string>();
    trips.forEach((trip) => {
      trip.destinations?.forEach((dest) => {
        if (dest.latitude && dest.longitude && !seenPlaces.has(dest.id)) {
          markers.push({ place: dest, tripId: trip.id, tripName: trip.name });
          seenPlaces.add(dest.id);
        }
      });
    });

    return {
      totalTrips,
      totalDestinations: uniqueDestinations.size,
      totalDays,
      totalExpenseAmount,
      userCurrency,
      isDefaultCurrency,
      transCounts,
      totalTransTimeMinutes,
      transTimeByMode,
      totalLodgings,
      totalNights,
      lodgingCountsByType,
      lodgingNightsByType,
      totalActivities: activities?.length || 0,
      avgActivitiesPerTrip: totalTrips > 0 ? (activities?.length || 0) / totalTrips : 0,
      numCurrencies: usedCurrencies.size,
      totalsByCurrency,
      markers,
    };
  }, [trips, transportations, lodgings, expenses, activities, user, rates]);

  return {
    stats,
    isLoading: tripsPending || transPending || lodgingsPending || expensesPending || activitiesPending || ratesPending,
  };
};
