import i18n from '../../../lib/i18n.ts';
import { UseFormReturnType } from '@mantine/form';
import { TextInput } from '@mantine/core';
import { AirportSelect } from './AirportSelect.tsx';
import { AirlineSelect } from './AirlineSelect.tsx';
import { CreateTransportation, Trip } from '../../../types/trips.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';

export const transportationConfig: { [key: string]: any } = {
  default: {
    components: {
      from: (form: UseFormReturnType<unknown>) => {
        return (
          <TextInput
            name={'from'}
            label={i18n.t('transportation_from', 'From')}
            required
            key={form.key('origin')}
            {...form.getInputProps('origin')}
          />
        );
      },
      to: (form: UseFormReturnType<unknown>) => {
        return (
          <TextInput
            name={'to'}
            label={i18n.t('transportation_to', 'To')}
            required
            key={form.key('destination')}
            {...form.getInputProps('destination')}
          />
        );
      },
      provider: (form: UseFormReturnType<unknown>) => {
        return (
          <TextInput
            name={'provider'}
            label={i18n.t('transportation_provider', 'Provider')}
            required
            key={form.key('provider')}
            {...form.getInputProps('provider')}
          />
        );
      },
    },
    buildPayload: (trip: Trip, transportationType: string, values: Record<string, any>): CreateTransportation => {
      return {
        type: transportationType,
        origin: values.origin,
        destination: values.destination,
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
        },
      };
    },
    strings: {
      providerLabel: i18n.t('transportation_provider', 'Provider'),
      reservationLabel: i18n.t('transportation_reservation', 'Reservation'),
    },
  },
  flight: {
    components: {
      from: (form: UseFormReturnType<unknown>) => {
        return (
          <AirportSelect
            form={form}
            propName={'origin'}
            label={i18n.t('transportation_from', 'From')}
            required={true}
            withAsterisk={true}
          />
        );
      },
      to: (form: UseFormReturnType<unknown>) => {
        return (
          <AirportSelect
            form={form}
            propName={'destination'}
            label={i18n.t('transportation_to', 'To')}
            required={true}
            withAsterisk={true}
          />
        );
      },
      provider: (form: UseFormReturnType<unknown>) => {
        return (
          <AirlineSelect
            form={form}
            propName={'provider'}
            label={i18n.t('transportation_airline', 'Airline')}
            required={true}
            withAsterisk={true}
          />
        );
      },
    },
    buildPayload: (trip: Trip, _transportationType: string, values: Record<string, any>): CreateTransportation => {
      return {
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
        },
      };
    },
    strings: {
      providerLabel: i18n.t('transportation_airline', 'Airline'),
      reservationLabel: i18n.t('transportation_confirmation_code', 'Confirmation Code'),
    },
  },
};
