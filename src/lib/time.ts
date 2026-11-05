import dayjs from 'dayjs';

import type { User } from '../types/auth.ts';
import type { Dayjs } from 'dayjs';

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

// Nights are the calendar days crossed, so check-in and check-out times don't add one.
// A stay within a single day still counts as a night.
export const countNights = (startDate: string, endDate: string) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!end.isAfter(start)) {
    return 0;
  }
  return Math.max(end.startOf('day').diff(start.startOf('day'), 'day'), 1);
};

// Departure and arrival are saved as local times at each end, so the time zone change
// has to come out of the difference when both timezones are known.
export const travelMinutes = (
  departureTime: string,
  arrivalTime: string,
  originTimezone?: string,
  destinationTimezone?: string
) => {
  if (originTimezone && destinationTimezone) {
    return dayjs.tz(arrivalTime, destinationTimezone).diff(dayjs.tz(departureTime, originTimezone), 'minute');
  }
  return dayjs(arrivalTime).diff(dayjs(departureTime), 'minute');
};

// Trip dates are saved in UTC from the browser's midnight, so the year has to start and
// end at the browser's midnight too, or 1 January falls into the previous year east of UTC.
export const startDateInYearFilter = (field: string, year: string) => {
  const start = dayjs(`${year}-01-01T00:00:00`);
  const format = (date: Dayjs) => date.toISOString().replace('T', ' ');
  return `${field} >= "${format(start)}" && ${field} < "${format(start.add(1, 'year'))}"`;
};

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
