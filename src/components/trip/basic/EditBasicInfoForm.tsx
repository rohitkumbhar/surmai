import { CreateTripForm, Trip } from '../../../types/trips.ts';
import { useTranslation } from 'react-i18next';
import { useForm } from '@mantine/form';
import { basicInfoFormValidation } from './validation.ts';
import { updateTrip } from '../../../lib';
import { EditTripBasicForm } from './EditTripBasicForm.tsx';
import { Button, Group } from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

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
      };
    }),
    participants: trip.participants?.map((item) => item.name),
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
          startDate: values.dateRange[0],
          endDate: values.dateRange[1],
          destinations: values.destinations?.map((d) => {
            return {
              id: d.id,
              name: d.name,
              stateName: d.stateName,
              countryName: d.countryName,
              latitude: d.latitude,
              longitude: d.longitude,
            };
          }),
          participants: values.participants?.map((name) => {
            return { name: name };
          }),
        };
        updateTrip(trip.id, data)
          .then(() => {
            setSaving(false);
            context.closeModal(id);
            onSave();
          })
          .catch((err) => {
            notifications.show({
              title: t('failed_save', 'Update failed'),
              message: err.message,
              position: 'top-right',
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
