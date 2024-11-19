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
        label={t('basic.trip_name', 'Name')}
        placeholder="Name"
        mt={'md'}
        required
        description={t('basic.trip_name_description', 'A short name for your trip e.g. Summer 2025 in Costa Rica')}
        key={form.key('name')}
        {...form.getInputProps('name')}
      />

      <Textarea
        label={t('basic.trip_description', 'Brief Description')}
        description={t('basic.trip_description_description', 'Optional: Brief description of the trip')}
        placeholder=""
        key={form.key('description')}
        {...form.getInputProps('description')}
      />

      <DestinationSelect propName={'destinations'} form={form as UseFormReturnType<unknown>} />

      {/*<TagsInput
        label={t('basic.trip_destinations', 'Destinations')}
        required
        key={form.key('destinations')}
        {...form.getInputProps('destinations')}
        acceptValueOnBlur
        description={t(
          'basic.trip_destinations_description',
          'Enter the destinations in this trip e.g. San Jose, Guanacaste'
        )}
        placeholder="Enter names"
      />*/}

      <DatePickerInput
        type="range"
        required
        label={t('basic.trip_dates', 'Trip Dates')}
        description={t('basic.trip_dates_description', 'Select the start and end dates of the trip')}
        placeholder="Pick date"
        key={form.key('dateRange')}
        {...form.getInputProps('dateRange')}
      />

      <TagsInput
        label={t('basic.travellers')}
        key={form.key('participants')}
        {...form.getInputProps('participants')}
        acceptValueOnBlur
        description={t('basic.travellers_description')}
        placeholder="Enter names"
      />
    </Stack>
  );
};
