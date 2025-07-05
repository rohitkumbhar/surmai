import i18n from '../../../lib/i18n.ts';
import { UseFormReturnType } from '@mantine/form';
import { TextInput } from '@mantine/core';
import { AirportSelect } from './AirportSelect.tsx';
import { AirlineSelect } from './AirlineSelect.tsx';
import { CreateTransportation, Place, Trip } from '../../../types/trips.ts';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { PlaceSelect } from '../../places/PlaceSelect.tsx';

export const transportationConfig: { [key: string]: any } = {
  default: {
    components: {
      from: (form: UseFormReturnType<unknown>, destinations: Place[] = []) => {
        return (
          <>
            <PlaceSelect
              form={form as UseFormReturnType<unknown>}
              propName={'origin'}
              presetDestinations={destinations}
              label={i18n.t('transportation_from', 'From')}
              description={i18n.t('origin_place', 'Origin Place')}
              key={form.key('origin')}
              {...form.getInputProps('origin')}
            />
            <TextInput
              name={'originAddress'}
              label={i18n.t('address', 'Address')}
              description={i18n.t('origin_address', 'Address of the car port, bus station etc.')}
              required
              key={form.key('originAddress')}
              {...form.getInputProps('originAddress')}
            />
          </>
        );
      },
      to: (form: UseFormReturnType<unknown>, destinations: Place[] = []) => {
        return (
          <>
            <PlaceSelect
              form={form as UseFormReturnType<unknown>}
              propName={'destination'}
              presetDestinations={destinations}
              label={i18n.t('transportation_to', 'To')}
              description={i18n.t('destination_place', 'Destination Place')}
              key={form.key('destination')}
              {...form.getInputProps('destination')}
            />
            <TextInput
              name={'destinationAddress'}
              label={i18n.t('address', 'Address')}
              description={i18n.t('destination_address', 'Address of the car port, bus station etc.')}
              required
              key={form.key('destinationAddress')}
              {...form.getInputProps('destinationAddress')}
            />
          </>
        );
      },
      provider: (form: UseFormReturnType<unknown>) => {
        return (
          <TextInput
            name={'provider'}
            label={i18n.t('transportation_provider', 'Provider')}
            description={i18n.t('transportation_provider_desc', 'Service provider. Bus/Ferry Company etc')}
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
