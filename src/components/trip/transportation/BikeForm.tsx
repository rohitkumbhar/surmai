import { Button, Grid, Group, rem, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { saveTransportation } from '../../../lib/api';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { AttachmentsUploadField } from '../attachments/AttachmentsUploadField.tsx';
import { TravellerMultiSelect } from '../TravellerMultiSelect.tsx';

import type { SaveEntityPayload } from '../../../lib/api';
import type {
  Attachment,
  BikeFormSchema,
  Expense,
  Transportation,
  TravellerProfile,
  Trip,
} from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const BikeForm = ({
  transportationType,
  trip,
  transportation,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
  tripTravellers = [],
}: {
  transportationType: string;
  trip: Trip;
  transportation?: Transportation;
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

  // Get expense from map if transportation has an expenseId
  const expense = transportation?.expenseId && expenseMap ? expenseMap.get(transportation.expenseId) : undefined;

  const form = useForm<BikeFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.metadata?.origin || transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.metadata?.destination || transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      link: transportation?.link,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      elevationGain: transportation?.metadata?.elevationGain,
      distance: transportation?.metadata?.distance,
      notes: transportation?.metadata?.notes || '',
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      originAddress: transportation?.metadata?.originAddress || '',
      destinationAddress: transportation?.metadata?.destinationAddress || '',
      travellers: transportation?.travellers || [],
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = async (values) => {
    setSaving(true);

    try {
      let existingExpenseId = transportation?.expenseId;
      if (existingExpenseId && expenseMap && !expenseMap.has(existingExpenseId)) {
        existingExpenseId = undefined;
      }

      const hasCost = values.cost && values.cost > 0;
      const originName = values.origin.name || values.origin;
      const destinationName = values.destination.name || values.destination;

      const payload: SaveEntityPayload = {
        entityId: transportation?.id,
        existingExpenseId: existingExpenseId || '',
        existingAttachmentIds: (exitingAttachments || []).map((a: Attachment) => a.id),
        expense: hasCost
          ? {
              name: `Transportation: ${originName} -> ${destinationName}`,
              cost: { value: values.cost as number, currency: values.currencyCode as string },
              occurredOn: fakeAsUtcString(values.departureTime),
              category: 'transportation',
            }
          : undefined,
        entityData: {
          type: transportationType,
          origin: originName,
          destination: destinationName,
          cost: { value: values.cost, currency: values.currencyCode },
          departureTime: fakeAsUtcString(values.departureTime),
          arrivalTime: fakeAsUtcString(values.arrivalTime),
          link: values.link,
          travellers: values.travellers || [],
          metadata: {
            provider: values.provider,
            reservation: values.reservation,
            origin: values.origin,
            destination: values.destination,
            originAddress: values.originAddress,
            destinationAddress: values.destinationAddress,
            elevationGain: values.elevationGain,
            distance: values.distance,
            notes: values.notes,
          },
        },
      };

      await saveTransportation(trip.id, payload, files);
      onSuccess();
    } catch (error) {
      console.error('Error saving transportation:', error);
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
            propName={'origin'}
            presetDestinations={trip.destinations || []}
            label={t('transportation_from', 'From')}
            description={t('origin_place', 'Origin Place')}
            key={form.key('origin')}
            {...form.getInputProps('origin')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'originAddress'}
            label={t('address', 'Address')}
            data-testid={'originAddress'}
            description={t('origin_address', 'Address of the car port, bus station etc.')}
            required
            key={form.key('originAddress')}
            {...form.getInputProps('originAddress')}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <PlaceSelect
            form={form as UseFormReturnType<unknown>}
            propName={'destination'}
            presetDestinations={trip.destinations || []}
            label={t('transportation_to', 'To')}
            description={t('destination_place', 'Destination Place')}
            key={form.key('destination')}
            {...form.getInputProps('destination')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'destinationAddress'}
            label={t('address', 'Address')}
            data-testid={'destinationAddress'}
            description={t('destination_address', 'Address of the car port, bus station etc.')}
            required
            key={form.key('destinationAddress')}
            {...form.getInputProps('destinationAddress')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
            valueFormat="lll"
            name={'departureTime'}
            description={t('departure_time_desc', 'Departure date and time')}
            miw={rem('200px')}
            label={t('transportation_departure_time', 'Departure')}
            clearable
            required
            defaultDate={trip.startDate}
            minDate={trip.startDate}
            maxDate={trip.endDate}
            key={form.key('departureTime')}
            {...form.getInputProps('departureTime')}
            data-testid={'departure-time'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateTimePicker
            valueFormat="lll"
            name={'arrivalTime'}
            label={t('transportation_arrival_time', 'Arrival')}
            description={t('arrival_time_desc', 'Arrival date and time')}
            required
            miw={rem('200px')}
            defaultDate={trip.startDate}
            minDate={trip.startDate}
            maxDate={dayjs(trip.endDate).endOf('day').toDate()}
            clearable
            key={form.key('arrivalTime')}
            {...form.getInputProps('arrivalTime')}
            data-testid={'arrival-time'}
            submitButtonProps={{
              'aria-label': 'Submit Date',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'elevationGain'}
            label={t('transportation_elevation_gain', 'Elevation Gain')}
            description={t('transportation_elevation_gain_desc', 'Elevation gain for the route')}
            key={form.key('elevationGain')}
            {...form.getInputProps('elevationGain')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            name={'distance'}
            label={t('transportation_distance', 'Distance')}
            key={form.key('distance')}
            description={t('distance_desc', 'Distance travelled')}
            {...form.getInputProps('distance')}
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
        <Grid.Col span={{ base: 12, md: 6 }}>
          <CurrencyInput
            costKey={form.key('cost')}
            costProps={form.getInputProps('cost')}
            currencyCodeKey={form.key('currencyCode')}
            currencyCodeProps={form.getInputProps('currencyCode')}
            label={t('transportation_cost', 'Cost')}
            description={t('transportation_cost_desc', 'Charges for this transportation')}
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
          <Textarea
            name={'notes'}
            label={t('notes', 'Notes')}
            description={t('general_notes', 'General notes about this entry')}
            key={form.key('notes')}
            {...form.getInputProps('notes')}
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
