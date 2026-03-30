import { Button, Grid, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { IconChairDirector, IconCodeCircle, IconLink, IconPlane } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AirlineSelect } from './AirlineSelect.tsx';
import { AirportSelect } from './AirportSelect.tsx';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { getFlightRoute, saveTransportation } from '../../../lib/api';
import { showErrorNotification } from '../../../lib/notifications.tsx';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { AttachmentsUploadField } from '../attachments/AttachmentsUploadField.tsx';
import { TravellerMultiSelect } from '../TravellerMultiSelect.tsx';

import type { SaveEntityPayload } from '../../../lib/api';
import type {
  Airline,
  Airport,
  Attachment,
  Expense,
  FlightFormSchema,
  Transportation,
  TravellerProfile,
  Trip,
} from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const FlightForm = ({
  trip,
  transportation,
  onSuccess,
  onCancel,
  exitingAttachments,
  expenseMap,
  tripTravellers = [],
}: {
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

  const [origin, setOrigin] = useState<Airport>(transportation?.metadata?.origin || transportation?.origin);
  const [destination, setDestination] = useState<Airport>(
    transportation?.metadata?.destination || transportation?.destination
  );
  const [airline, setAirline] = useState<Airline>(transportation?.metadata?.provider);

  const _loadFlightInfo = (f: UseFormReturnType<unknown>, flightNumber: string) => {
    if (!flightNumber || flightNumber === '' || flightNumber === transportation?.metadata?.flightNumber) {
      return;
    }

    getFlightRoute(flightNumber).then((route) => {
      const origin = route?.origin;
      const destination = route?.destination;
      const airline = route?.airline;

      if (origin) {
        f.setFieldValue('origin', origin);
        setOrigin(origin);
      }

      if (destination) {
        f.setFieldValue('destination', destination);
        setDestination(destination);
      }

      if (airline) {
        f.setFieldValue('provider', airline);
        setAirline(airline);
      }
    });
  };

  const getFlightInfo = useDebouncedCallback((f: UseFormReturnType<unknown>, flightNumber: string) => {
    _loadFlightInfo(f, flightNumber);
  }, 500);

  const expense = transportation?.expenseId && expenseMap ? expenseMap.get(transportation.expenseId) : undefined;
  const form = useForm<FlightFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.metadata?.origin || transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.metadata?.destination || transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      link: transportation?.link,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      cost: expense?.cost?.value,
      currencyCode: expense?.cost?.currency || user?.currencyCode || 'USD',
      flightNumber: transportation?.metadata?.flightNumber || '',
      notes: transportation?.metadata?.notes || '',
      seats: transportation?.metadata?.seats || '',
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

      const payload: SaveEntityPayload = {
        entityId: transportation?.id,
        existingExpenseId: existingExpenseId || '',
        existingAttachmentIds: (exitingAttachments || []).map((a: Attachment) => a.id),
        expense: hasCost
          ? {
              name: `Flight: ${values.origin.iataCode || values.origin} to ${values.destination.iataCode || values.destination}`,
              cost: { value: values.cost as number, currency: values.currencyCode as string },
              occurredOn: fakeAsUtcString(values.departureTime),
              category: 'transportation',
            }
          : undefined,
        entityData: {
          type: 'flight',
          origin: values.origin.iataCode || values.origin,
          destination: values.destination.iataCode || values.destination,
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
            flightNumber: values.flightNumber,
            seats: values.seats,
            notes: values.notes,
          },
        },
      };

      await saveTransportation(trip.id, payload, files);
      onSuccess();
    } catch (error) {
      showErrorNotification({
        error,
        title: t('flight_creation_failed', 'Unable to save flight'),
        message: 'Please try again later.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Stack>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              name={'flightNumber'}
              label={t('transportation_flight_number', 'Flight Number')}
              key={form.key('flightNumber')}
              rightSection={<IconPlane size={15} />}
              description={t('flight_number_desc', 'ICAO Flight Designation')}
              {...form.getInputProps('flightNumber')}
              onBlur={(ev) => {
                // @ts-expect-error it ok
                getFlightInfo(form, ev.target.value);
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              name={'reservation'}
              label={t('transportation_confirmation_code', 'Confirmation Code')}
              key={form.key('reservation')}
              description={t('reservation_desc', 'Ticket Id, Confirmation code etc')}
              {...form.getInputProps('reservation')}
              rightSection={<IconCodeCircle size={15} />}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <AirportSelect
              form={form as unknown as UseFormReturnType<unknown>}
              propName={'origin'}
              label={t('transportation_from', 'From')}
              description={t('airport_from_desc', 'Departure Airport')}
              currentValue={origin}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateTimePicker
              valueFormat="lll"
              name={'departureTime'}
              description={t('departure_time_desc', 'Departure date and time')}
              label={t('transportation_departure_time', 'Departure')}
              clearable
              required
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
            <AirportSelect
              form={form as unknown as UseFormReturnType<unknown>}
              propName={'destination'}
              label={t('transportation_to', 'To')}
              description={t('airport_to_desc', 'Arrival Airport')}
              currentValue={destination}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateTimePicker
              valueFormat="lll"
              name={'arrivalTime'}
              label={t('transportation_arrival_time', 'Arrival')}
              description={t('arrival_time_desc', 'Arrival date and time')}
              required
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
            <AirlineSelect
              form={form as unknown as UseFormReturnType<unknown>}
              propName={'provider'}
              label={t('transportation_airline', 'Airline')}
              description={t('airline_desc', 'Select an Airline')}
              required={true}
              withAsterisk={true}
              currentValue={airline}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              name={'seats'}
              label={t('seats', 'Seats')}
              key={form.key('seats')}
              description={t('seats_desc', 'Reserved seats, if any')}
              rightSection={<IconChairDirector size={15} />}
              {...form.getInputProps('seats')}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              name={'link'}
              label={t('link', 'Link')}
              key={form.key('link')}
              description={t('link_desc', 'Related link')}
              rightSection={<IconLink size={15} />}
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
