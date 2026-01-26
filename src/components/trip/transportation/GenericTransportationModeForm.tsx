import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import {
  createTransportationEntry,
  uploadAttachments,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../../lib/api';
import { updateTransportation } from '../../../lib/api/pocketbase/transportations.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';

import type {
  Attachment,
  CreateTransportation,
  Expense,
  Transportation,
  TransportationFormSchema,
  Trip,
} from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const GenericTransportationModeForm = ({
  transportationType,
  trip,
  transportation,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
}: {
  transportationType: string;
  trip: Trip;
  transportation?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
  expenseMap?: Map<string, Expense>;
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState<boolean>(false);

  // Get expense from map if transportation has an expenseId
  const expense = transportation?.expenseId && expenseMap ? expenseMap.get(transportation.expenseId) : undefined;

  const form = useForm<TransportationFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.metadata?.origin || transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.metadata?.destination || transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      originAddress: transportation?.metadata?.originAddress || '',
      destinationAddress: transportation?.metadata?.destinationAddress || '',
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = async (values) => {
    setSaving(true);

    try {
      // Upload attachments first
      const attachments = await uploadAttachments(trip.id, files);

      // Handle expense creation/update/deletion based on cost value
      let expenseId = transportation?.expenseId;

      // Check if expenseId exists in expenseMap, set to null if not found
      if (expenseId && expenseMap && !expenseMap.has(expenseId)) {
        expenseId = undefined;
      }

      const hasCost = values.cost && values.cost > 0;

      if (hasCost) {
        if (expenseId) {
          // Update existing expense - only update cost
          await updateExpense(expenseId, {
            cost: {
              value: values.cost as number,
              currency: values.currencyCode as string,
            },
          });
        } else {
          // Create new expense with all fields
          const originName = values.origin.name || values.origin;
          const destinationName = values.destination.name || values.destination;
          const expenseData = {
            name: `Transportation: ${originName} -> ${destinationName}`,
            trip: trip.id,
            cost: {
              value: values.cost as number,
              currency: values.currencyCode as string,
            },
            occurredOn: fakeAsUtcString(values.departureTime),
            category: 'transportation',
          };
          const newExpense = await createExpense(expenseData);
          expenseId = newExpense.id;
        }
      } else if (expenseId) {
        // Delete expense if cost is removed
        await deleteExpense(expenseId);
        expenseId = undefined;
      }

      // Prepare transportation data
      const payload: CreateTransportation = {
        type: transportationType,
        origin: values.origin.name || values.origin,
        destination: values.destination.name || values.destination,
        cost: {
          value: values.cost,
          currency: values.currencyCode,
        },
        departureTime: fakeAsUtcString(values.departureTime),
        arrivalTime: fakeAsUtcString(values.arrivalTime),
        trip: trip.id,
        metadata: {
          provider: values.provider,
          reservation: values.reservation,
          origin: values.origin,
          destination: values.destination,
          originAddress: values.originAddress,
          destinationAddress: values.destinationAddress,
        },
      };

      // Update or create transportation
      if (transportation?.id) {
        payload.attachmentReferences = [
          ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
          ...attachments.map((attachment: Attachment) => attachment.id),
        ];
        payload.expenseId = expenseId;
        await updateTransportation(transportation.id, payload);
      } else {
        payload.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
        payload.expenseId = expenseId;
        await createTransportationEntry(payload);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving transportation:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Stack>
        <Group>
          <PlaceSelect
            form={form as UseFormReturnType<unknown>}
            propName={'origin'}
            presetDestinations={trip.destinations || []}
            label={t('transportation_from', 'From')}
            description={t('origin_place', 'Origin Place')}
            key={form.key('origin')}
            {...form.getInputProps('origin')}
          />
          <TextInput
            name={'originAddress'}
            label={t('address', 'Address')}
            data-testid={'originAddress'}
            description={t('origin_address', 'Address of the car port, bus station etc.')}
            required
            key={form.key('originAddress')}
            {...form.getInputProps('originAddress')}
          />

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
        </Group>
        <Group>
          <PlaceSelect
            form={form as UseFormReturnType<unknown>}
            propName={'destination'}
            presetDestinations={trip.destinations || []}
            label={t('transportation_to', 'To')}
            description={t('destination_place', 'Destination Place')}
            key={form.key('destination')}
            {...form.getInputProps('destination')}
          />
          <TextInput
            name={'destinationAddress'}
            label={t('address', 'Address')}
            data-testid={'destinationAddress'}
            description={t('destination_address', 'Address of the car port, bus station etc.')}
            required
            key={form.key('destinationAddress')}
            {...form.getInputProps('destinationAddress')}
          />
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
        </Group>
        <Group>
          <TextInput
            name={'provider'}
            label={t('transportation_provider', 'Provider')}
            description={t('transportation_provider_desc', 'Service provider. Bus/Ferry Company etc')}
            required
            key={form.key('provider')}
            {...form.getInputProps('provider')}
          />
          <TextInput
            name={'reservation'}
            label={t('transportation_reservation', 'Reservation')}
            key={form.key('reservation')}
            description={t('reservation_desc', 'Ticket Id, Confirmation code etc')}
            {...form.getInputProps('reservation')}
          />
        </Group>
        <Group>
          <CurrencyInput
            costKey={form.key('cost')}
            costProps={form.getInputProps('cost')}
            currencyCodeKey={form.key('currencyCode')}
            currencyCodeProps={form.getInputProps('currencyCode')}
            label={t('transportation_cost', 'Cost')}
            description={t('transportation_cost_desc', 'Charges for this transportation')}
          />
        </Group>
        <Group>
          <Stack>
            <Group>
              <Title size={'md'}>
                {t('attachments', 'Attachments')}
                <Text size={'xs'} c={'dimmed'}>
                  {t('transportation_attachments_desc', 'Upload any related documents e.g. confirmation email')}
                </Text>
              </Title>
            </Group>
            <Group>
              {files.map((file, index) => (
                <Text key={index}>{file.name}</Text>
              ))}
            </Group>

            <Group>
              <FileButton
                onChange={setFiles}
                accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/html"
                form={'files'}
                name={'files'}
                multiple
              >
                {(props) => {
                  if (transportation?.id) {
                    return (
                      <Stack>
                        <Text
                          size={'xs'}
                        >{`${exitingAttachments ? exitingAttachments.length : 0} existing files`}</Text>
                        <Button {...props}>{t('upload_more', 'Upload More')}</Button>
                      </Stack>
                    );
                  } else {
                    return <Button {...props}>{t('upload', 'Upload')}</Button>;
                  }
                }}
              </FileButton>
            </Group>
          </Stack>
        </Group>
        <Group justify={'flex-end'}>
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
      </Stack>
    </form>
  );
};
