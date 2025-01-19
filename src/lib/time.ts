import { User } from '../types/auth.ts';
import dayjs from 'dayjs';

export const calculateTimezoneDifference = (user: User | undefined, timezone: string) => {
  const baseline = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const userTimezone = user?.timezone || dayjs.tz.guess();
  const destinationTimezoneInstant = dayjs.tz(baseline, timezone);
  const userTimezoneInstant = dayjs.tz(baseline, userTimezone);
  return destinationTimezoneInstant.diff(userTimezoneInstant, 'hours', true);
};

export const formatDate = (locale: string, input: Date) => {
  return input.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (input: Date) => {
  return `${String(input.getHours()).padStart(2, '0')}:${String(input.getMinutes()).padStart(2, '0')}`;
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
export const fakeAsUtcString = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00.000Z`;
};

export const convertSavedToBrowserDate = (dateString: string) => {
  const d = dayjs(dateString, 'UTC').tz('UTC');
  const convertedDate = new Date();
  convertedDate.setFullYear(d.year());
  convertedDate.setMonth(d.month());
  convertedDate.setDate(d.date());
  convertedDate.setHours(d.hour());
  convertedDate.setMinutes(d.minute());
  convertedDate.setSeconds(0);
  convertedDate.setMilliseconds(0);
  return convertedDate;
};
