import { MultiSelect, Stack, Textarea, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { PlaceMultiSelect } from '../../places/PlaceMultiSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { listTravellerProfiles } from '../../../lib/api/pocketbase/traveller_profiles.ts';

import type { CreateTripForm } from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

interface EditTripBasicFormProps {
  form: UseFormReturnType<CreateTripForm>;
}

export const EditTripBasicForm = ({ form }: EditTripBasicFormProps) => {
  const { t } = useTranslation();

  const { data: travellerProfiles } = useQuery({
    queryKey: ['traveller_profiles'],
    queryFn: listTravellerProfiles,
  });

  const travellerOptions = (travellerProfiles || []).map((p) => ({
    value: p.id,
    label: `${p.legalName} (${p.email})`,
  }));

  return (
    <Stack align="stretch" justify="center" gap="md">
      <TextInput
        name={'tripName'}
        label={t('trip_name', 'Name')}
        placeholder="Name"
        mt={'md'}
        required
        description={t('trip_name_description', 'A short name for your trip e.g. Summer 2025 in Costa Rica')}
        key={form.key('name')}
        {...form.getInputProps('name')}
      />

      <Textarea
        name={'tripDesc'}
        label={t('trip_description', 'Brief Description')}
        description={t('trip_description_description', 'Optional: Brief description of the trip')}
        placeholder=""
        key={form.key('description')}
        {...form.getInputProps('description')}
      />

      <PlaceMultiSelect propName={'destinations'} form={form as UseFormReturnType<unknown>} />

      <DatePickerInput
        type="range"
        valueFormat={'LL'}
        required
        label={t('trip_dates', 'Trip Dates')}
        description={t(
          'trip_dates_description',
          'Select the start and end dates of the trip. These dates are in your timezone'
        )}
        key={form.key('dateRange')}
        data-testid={'trip-dates'}
        {...form.getInputProps('dateRange')}
      />

      <MultiSelect
        label={t('select_travellers', 'Travelers')}
        description={t('trip_traveller_profiles_description', 'Select traveler profiles to assign to this trip')}
        data={travellerOptions}
        searchable
        key={form.key('travellers')}
        {...form.getInputProps('travellers')}
      />

      <CurrencyInput
        costKey={form.key('budgetAmount')}
        costProps={form.getInputProps('budgetAmount')}
        currencyCodeKey={form.key('budgetCurrency')}
        currencyCodeProps={form.getInputProps('budgetCurrency')}
        label={t('trip_budget', 'Budget')}
        description={t('trip_budget_description', 'Optional: Total budget for this trip')}
        maxWidth={280}
      />
    </Stack>
  );
};
