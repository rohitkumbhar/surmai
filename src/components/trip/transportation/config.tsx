import i18n from '../../../lib/i18n.ts';

export const transportationConfig: { [key: string]: any } = {
  default: {
    strings: {
      providerLabel: i18n.t('transportation_provider', 'Provider'),
      reservationLabel: i18n.t('transportation_reservation', 'Reservation'),
    },
  },
  flight: {
    strings: {
      providerLabel: i18n.t('transportation_airline', 'Airline'),
      reservationLabel: i18n.t('transportation_confirmation_code', 'Confirmation Code'),
    },
  },
};
