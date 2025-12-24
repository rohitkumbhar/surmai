import { Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EditTripBasicForm } from './EditTripBasicForm.tsx';
import { basicInfoFormValidation } from './validation.ts';
import { updateTrip } from '../../../lib/api';
import { showErrorNotification } from '../../../lib/notifications.tsx';

import type { CreateTripForm, Trip } from '../../../types/trips.ts';
import type { ContextModalProps } from '@mantine/modals';

export const EditBasicInfoForm = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  trip: Trip;
  onSave: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}>) => {
  const { trip, onSave } = innerProps;
  const { t } = useTranslation();
  const [saving, setSaving] = useState<boolean>(false);
  const initialValues: CreateTripForm = {
    name: trip.name,
    description: trip.description,
    dateRange: [trip.startDate, trip.endDate],
    destinations: trip.destinations?.map((item) => {
      return {
        id: item.id || nanoid(),
        name: item.name,
        stateName: item.stateName,
        countryName: item.countryName,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone,
      };
    }),
    participants: trip.participants?.map((item) => item.name),
    budgetAmount: trip.budget?.value,
    budgetCurrency: trip.budget?.currency,
  };

  const form = useForm<CreateTripForm>({
    mode: 'uncontrolled',
    initialValues: initialValues,
    validate: basicInfoFormValidation,
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        setSaving(true);
        const data = {
          name: values.name,
          description: values.description,
          startDate: dayjs(values.dateRange[0]).startOf('day').toDate(),
          endDate: dayjs(values.dateRange[1]).endOf('day').toDate(),
          destinations: values.destinations?.map((d) => {
            return {
              id: d.id,
              name: d.name,
              stateName: d.stateName,
              countryName: d.countryName,
              latitude: d.latitude,
              longitude: d.longitude,
              timezone: d.timezone,
            };
          }),
          participants: values.participants?.map((name) => {
            return { name: name };
          }),
          budget:
            values.budgetAmount && values.budgetCurrency
              ? { value: values.budgetAmount, currency: values.budgetCurrency }
              : undefined,
        };
        updateTrip(trip.id, data as unknown as Trip)
          .then(() => {
            setSaving(false);
            context.closeModal(id);
            onSave();
          })
          .catch((err) => {
            showErrorNotification({
              error: err,
              title: t('edit_trip', 'Edit Trip'),
              message: t('trip_update_failed', 'Failed to update trip.'),
            });
          })
          .finally(() => setSaving(false));
      })}
    >
      <EditTripBasicForm form={form} />
      <Group justify={'flex-end'}>
        <Button
          loading={saving}
          mt="xl"
          type={'button'}
          variant={'default'}
          w={'min-content'}
          onClick={() => {
            context.closeModal(id);
          }}
        >
          {t('cancel', 'Cancel')}
        </Button>
        <Button mt="xl" type={'submit'}>
          {t('save', 'Save')}
        </Button>
      </Group>
    </form>
  );
};
