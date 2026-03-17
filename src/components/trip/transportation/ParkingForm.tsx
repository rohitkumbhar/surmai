import { Button, Grid, Group, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { saveTransportation } from '../../../lib/api';
import { showErrorNotification } from '../../../lib/notifications.tsx';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { AttachmentsUploadField } from '../attachments/AttachmentsUploadField.tsx';
import { TravellerMultiSelect } from '../TravellerMultiSelect.tsx';

import type { SaveEntityPayload } from '../../../lib/api';
import type { Attachment, Expense, ParkingFormSchema, Transportation, TravellerProfile, Trip } from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const ParkingForm = ({
  trip,
  parking,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
  tripTravellers = [],
}: {
  trip: Trip;
  parking?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
  expenseMap?: Map<string, Expense>;
  tripTravellers?: TravellerProfile[];
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);

  // Get expense from map if parking has an expenseId
  const expense = parking?.expenseId && expenseMap ? expenseMap.get(parking.expenseId) : undefined;

  const form = useForm<ParkingFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      provider: parking?.metadata?.provider,
      address: parking?.origin,
      startDate: parking?.departureTime,
      endDate: parking?.arrivalTime,
      link: parking?.link,
      confirmationCode: parking?.metadata?.confirmationCode,
      spotNumber: parking?.metadata?.spotNumber,
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      place: parking?.metadata?.place,
      travellers: parking?.travellers || [],
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = async (values) => {
    setSaving(true);

    try {
      let existingExpenseId = parking?.expenseId;
      if (existingExpenseId && expenseMap && !expenseMap.has(existingExpenseId)) {
        existingExpenseId = undefined;
      }

      const hasCost = values.cost && values.cost > 0;

      const payload: SaveEntityPayload = {
        entityId: parking?.id,
        existingExpenseId: existingExpenseId || '',
        existingAttachmentIds: (exitingAttachments || []).map((a: Attachment) => a.id),
        expense: hasCost
          ? {
              name: `Parking: ${values.provider || values.address}`,
              cost: { value: values.cost as number, currency: values.currencyCode as string },
              occurredOn: fakeAsUtcString(values.startDate),
              category: 'transportation',
            }
          : undefined,
        entityData: {
          type: 'parking',
          origin: values.address,
          destination: values.address,
          link: values.link,
          travellers: values.travellers || [],
          cost: { value: values.cost, currency: values.currencyCode },
          departureTime: fakeAsUtcString(values.startDate),
          arrivalTime: fakeAsUtcString(values.endDate),
          metadata: {
            confirmationCode: values.confirmationCode,
            provider: values.provider,
            spotNumber: values.spotNumber,
            place: values.place,
          },
        },
      };

      await saveTransportation(trip.id, payload, files);
      onSuccess();
    } catch (error) {
      console.error('Error saving parking:', error);
      showErrorNotification({
        error,
        title: t('parking_creation_failed', 'Unable to create Parking Entry'),
        message: 'Please try again later.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <PlaceSelect
            form={form as UseFormReturnType<unknown>}
            propName={'place'}
            presetDestinations={trip.destinations || []}
            label={t('associated_destination', 'Destination')}
            description={t('associated_destination_desc', 'Associated Destination')}
            key={form.key('place')}
            {...form.getInputProps('place')}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'provider'}
            label={t('parking_provider', 'Provider')}
            description={t('parking_provider_desc', 'Name of the parking provider')}
            key={form.key('provider')}
            {...form.getInputProps('provider')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'address'}
            label={t('parking_address', 'Address')}
            description={t('parking_address_desc', 'Address of the parking location')}
            required
            key={form.key('address')}
            {...form.getInputProps('address')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'spotNumber'}
            label={t('parking_spot_number', 'Spot Number')}
            description={t('parking_spot_number_desc', 'Parking spot number or identifier')}
            key={form.key('spotNumber')}
            {...form.getInputProps('spotNumber')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
            valueFormat="DD MMM YYYY hh:mm A"
            name={'startDate'}
            label={t('parking_start_date', 'Start Date')}
            description={t('parking_start_date_desc', 'Date and time for parking start')}
            clearable
            required
            key={form.key('startDate')}
            {...form.getInputProps('startDate')}
            defaultDate={trip.startDate}
            minDate={trip.startDate}
            maxDate={dayjs(trip.endDate).endOf('day').toDate()}
            data-testid={'parking-start-date'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
            valueFormat="DD MMM YYYY hh:mm A"
            name={'endDate'}
            label={t('parking_end_date', 'End Date')}
            description={t('parking_end_date_desc', 'Date and time for parking end')}
            clearable
            required
            key={form.key('endDate')}
            {...form.getInputProps('endDate')}
            defaultDate={trip.startDate}
            minDate={trip.startDate}
            maxDate={dayjs(trip.endDate).endOf('day').toDate()}
            data-testid={'parking-end-date'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          {' '}
          <TextInput
            name={'confirmationCode'}
            label={t('transportation_confirmation_code', 'Confirmation Code')}
            description={t('transportation_confirmation_code_desc', 'Reservation Id, Booking code etc')}
            key={form.key('confirmationCode')}
            {...form.getInputProps('confirmationCode')}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <CurrencyInput
            costKey={form.key('cost')}
            costProps={form.getInputProps('cost')}
            currencyCodeKey={form.key('currencyCode')}
            currencyCodeProps={form.getInputProps('currencyCode')}
            label={t('parking_cost', 'Cost')}
            description={t('parking_cost_desc', 'Charges for this parking')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'link'}
            label={t('link', 'Link')}
            key={form.key('link')}
            description={t('link_desc', 'Related link')}
            {...form.getInputProps('link')}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <TravellerMultiSelect
            tripTravellers={tripTravellers}
            value={form.getValues().travellers}
            onChange={(value) => form.setFieldValue('travellers', value)}
            formKey={form.key('travellers')}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <AttachmentsUploadField files={files} setFiles={setFiles} />
        </Grid.Col>
      </Grid>

      <Group justify={'flex-end'} pt={'md'}>
        <Button type={'submit'} w={'min-content'} loading={saving}>
          {t('save', 'Save')}
        </Button>
        <Button
          type={'button'}
          variant={'default'}
          w={'min-content'}
          onClick={() => {
            onCancel();
          }}
        >
          {t('cancel', 'Cancel')}
        </Button>
      </Group>
    </form>
  );
};
