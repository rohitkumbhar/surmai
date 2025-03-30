import { Stack, TagsInput, Textarea, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import { UseFormReturnType } from '@mantine/form';
import { CreateTripForm } from '../../../types/trips.ts';
import { DestinationSelect } from '../../destinations/DestinationSelect.tsx';

interface EditTripBasicFormProps {
  form: UseFormReturnType<CreateTripForm>;
}

export const EditTripBasicForm = ({ form }: EditTripBasicFormProps) => {
  const { t } = useTranslation();
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

      <DestinationSelect propName={'destinations'} form={form as UseFormReturnType<unknown>} />

      <DatePickerInput
        type="range"
        required
        label={t('trip_dates', 'Trip Dates')}
        description={t(
          'trip_dates_description',
          'Select the start and end dates of the trip. These dates are in your timezone'
        )}
        placeholder="Pick date"
        key={form.key('dateRange')}
        {...form.getInputProps('dateRange')}
      />

      <TagsInput
        label={t('trip_travellers')}
        key={form.key('participants')}
        {...form.getInputProps('participants')}
        acceptValueOnBlur
        description={t('trip_travellers_description')}
        placeholder="Enter names"
      />
    </Stack>
  );
};
