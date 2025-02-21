import i18n from '../../../lib/i18n.ts';
import { UseFormReturnType } from '@mantine/form';
import { TextInput } from '@mantine/core';
import { AirportSelect } from './AirportSelect.tsx';
import { AirlineSelect } from './AirlineSelect.tsx';

export const transportationConfig: { [key: string]: any } = {
  // strings
  // provider component

  default: {
    components: {
      from: (form: UseFormReturnType<unknown>) => {
        return (
          <TextInput
            name={'from'}
            label={i18n.t('transportation.from', 'From')}
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
            label={i18n.t('transportation.to', 'To')}
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
            label={i18n.t('transportation.provider', 'Provider')}
            required
            key={form.key('provider')}
            {...form.getInputProps('provider')}
          />
        );
      },
    },

    strings: {
      providerLabel: i18n.t('transportation.provider', 'Provider'),
      reservationLabel: i18n.t('transportation.reservation', 'Reservation'),
    },
  },
  flight: {
    components: {
      from: (form: UseFormReturnType<unknown>) => {
        return (
          <AirportSelect
            form={form}
            propName={'origin'}
            label={i18n.t('transportation.from', 'From')}
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
            label={i18n.t('transportation.to', 'To')}
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
            label={i18n.t('transportation.airline', 'Airline')}
            required={true}
            withAsterisk={true}
          />
        );
      },
    },

    strings: {
      providerLabel: i18n.t('transportation.airline', 'Airline'),
      reservationLabel: i18n.t('transportation.confirmation_code', 'Confirmation Code'),
    },
  },
};
