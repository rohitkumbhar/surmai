import dayjs from 'dayjs';

import type { User } from '../types/auth.ts';

export const calculateTimezoneDifference = (user: User | undefined, timezone: string) => {
  const baseline = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const userTimezone = user?.timezone || dayjs.tz.guess();
  const destinationTimezoneInstant = dayjs.tz(baseline, timezone);
  const userTimezoneInstant = dayjs.tz(baseline, userTimezone);
  return destinationTimezoneInstant.diff(userTimezoneInstant, 'hours', true);
};

export const getFormatTimeString = (user: User | undefined) => {
  if (user?.timeFormat === '12') {
    return 'h:mm A';
  } else if (user?.timeFormat === '24') {
    return 'HH:mm';
  }
  return 'LT';
}

export const getFormatDateTimeString = (user: User | undefined) => {
  return 'll ' + getFormatTimeString(user);
}

export const getTimePickerFormat = (user: User | undefined) => {
  if (user?.timeFormat === '12') {
    return '12h';
  } else if (user?.timeFormat === '24') {
    return '24h';
  }
  // dayjs LocaleData does not have 12/24 hr info, so just default to 24
  return '24h';
}

export const formatDate = (_locale: string, input: string) => {
  return dayjs(input).format('ll');
};

export const formatTime = (input: string, user?: User | undefined) => {
  return dayjs(input).format(getFormatTimeString(user));
};

export const formatDateTime = (input: string, user?: User | undefined) => {
  return dayjs(input).format(getFormatDateTimeString(user));
};

/*
    What is going on here?
    - Pocketbase saves and returns the dates in UTC
    - The date/time selected by the user for any transportation, lodging or activity are usually local times in
      timezone of the destination
    - We don't always know the timezone of the destination
    - It gets rather confusing (or incorrect) if we save the selected time in current (browser) timezone, and display
      it in the browser timezone. We expect these timestamps to be the exact same string, viewed from anywhere,

   Given that ^, we either save these timestamps as strings in the database or do some shenanigans to make them look the
   same everywhere. Having them as dates are helpful for UX or manipulation e.g. DateTimePicker control expects dates,
   it's easier to sort dates etc.

   So, the implementation is:
   - A date/time picked by the date picker is converted (faked) as a UTC timestamp by appending the Z before
     saving to the database (fakeAsUtcString method)
   - This date is returned as a string by the API and is fakes as the browser date with the current timezone
     (convertSavedToBrowserDate method)

 */
export const fakeAsUtcString = (date: string | undefined): string => {
  if (!date) {
    return '';
  }

  return dayjs(date, 'UTC').format('YYYY-MM-DDTHH:mm:ss[Z]');
};

export const convertSavedToBrowserDate = (dateString: string | undefined) => {
  if (!dateString) {
    return undefined;
  }
  const d = dayjs.tz(dateString, 'UTC');
  return d.format('YYYY-MM-DDTHH:mm:ss');
};
