import { Button, FileButton, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  Airline,
  Airport,
  Attachment,
  CreateTransportation,
  FlightFormSchema,
  Transportation,
  Trip,
} from '../../../types/trips.ts';
import { useForm, UseFormReturnType } from '@mantine/form';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { createTransportationEntry, getFlightRoute, uploadAttachments } from '../../../lib/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import dayjs from 'dayjs';
import { updateTransportation } from '../../../lib/api/pocketbase/transportations.ts';
import i18n from '../../../lib/i18n.ts';
import { AirportSelect } from './AirportSelect.tsx';
import { AirlineSelect } from './AirlineSelect.tsx';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { IconChairDirector, IconCodeCircle, IconPlane } from '@tabler/icons-react';
import { useDebouncedCallback } from '@mantine/hooks';

export const FlightForm = ({
  trip,
  transportation,
  onSuccess,
  onCancel,
  exitingAttachments,
}: {
  trip: Trip;
  transportation?: Transportation;
  onSuccess: () => void;
  onCancel: () => void;
  exitingAttachments?: Attachment[];
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

  const form = useForm<FlightFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      origin: transportation?.metadata?.origin || transportation?.origin,
      departureTime: transportation?.departureTime,
      destination: transportation?.metadata?.destination || transportation?.destination,
      arrivalTime: transportation?.arrivalTime,
      provider: transportation?.metadata?.provider,
      reservation: transportation?.metadata?.reservation,
      cost: transportation?.cost?.value,
      currencyCode: transportation?.cost?.currency || user?.currencyCode || 'USD',
      flightNumber: transportation?.metadata?.flightNumber || '',
      seats: transportation?.metadata?.seats || '',
    },
    validate: {},
  });

  // @ts-expect-error it ok
  const handleFormSubmit = (values) => {
    setSaving(true);
    const payload: CreateTransportation = {
      type: 'flight',
      origin: values.origin.iataCode || values.origin,
      destination: values.destination.iataCode || values.destination,
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
        flightNumber: values.flightNumber,
        seats: values.seats,
      },
    };

    uploadAttachments(trip.id, files)
      .then((attachments: Attachment[]) => {
        if (transportation?.id) {
          payload.attachmentReferences = [
            ...(exitingAttachments || []).map((attachment: Attachment) => attachment.id),
            ...attachments.map((attachment: Attachment) => attachment.id),
          ];
          updateTransportation(transportation.id, payload)
            .then(() => {
              onSuccess();
            })
            .catch((error) => {
              console.log('error => ', error);
            });
        } else {
          payload.attachmentReferences = attachments.map((attachment: Attachment) => attachment.id);
          createTransportationEntry(payload)
            .then(() => {
              onSuccess();
            })
            .catch((error) => {
              console.log('error => ', error);
            });
        }
        setSaving(false);
      })
      .catch((error) => {
        console.log('error => ', error);
      });
  };

  return (
    <form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
      <Stack>
        <Group>
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

          <TextInput
            name={'reservation'}
            label={t('transportation_confirmation_code', 'Confirmation Code')}
            key={form.key('reservation')}
            description={t('reservation_desc', 'Ticket Id, Confirmation code etc')}
            {...form.getInputProps('reservation')}
            rightSection={<IconCodeCircle size={15} />}
          />
        </Group>
        <Group>
          <AirportSelect
            form={form as unknown as UseFormReturnType<unknown>}
            propName={'origin'}
            label={i18n.t('transportation_from', 'From')}
            description={i18n.t('airport_from_desc', 'Departure Airport')}
            currentValue={origin}
          />

          <DateTimePicker
            highlightToday
            valueFormat="lll"
            name={'departureTime'}
            description={t('departure_time_desc', 'Departure date and time')}
            miw={rem('280px')}
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
          <AirportSelect
            form={form as unknown as UseFormReturnType<unknown>}
            propName={'destination'}
            label={i18n.t('transportation_to', 'To')}
            description={i18n.t('airport_to_desc', 'Arrival Airport')}
            currentValue={destination}
          />
          <DateTimePicker
            valueFormat="lll"
            name={'arrivalTime'}
            label={t('transportation_arrival_time', 'Arrival')}
            description={t('arrival_time_desc', 'Arrival date and time')}
            required
            miw={rem('280px')}
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
          <AirlineSelect
            form={form as unknown as UseFormReturnType<unknown>}
            propName={'provider'}
            label={t('transportation_airline', 'Airline')}
            description={t('airline_desc', 'Select an Airline')}
            required={true}
            withAsterisk={true}
            currentValue={airline}
          />

          <TextInput
            name={'seats'}
            label={t('seats', 'Seats')}
            key={form.key('seats')}
            description={t('seats_desc', 'Reserved seats, if any')}
            rightSection={<IconChairDirector size={15} />}
            {...form.getInputProps('seats')}
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
                accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
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
