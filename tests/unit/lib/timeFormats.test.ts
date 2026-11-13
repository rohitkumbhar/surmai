import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  calculateTimezoneDifference,
  convertSavedToBrowserDate,
  fakeAsUtcString,
  formatDateTime,
  formatTime,
  getFormatDateTimeString,
  getFormatTimeString,
  getTimePickerFormat,
} from '@src/lib/time';

import type { User } from '@src/types/auth';

const withFormat = (timeFormat?: string) => ({ timeFormat }) as User;

describe('getFormatTimeString', () => {
  it('uses a 12 hour pattern when the user asked for one', () => {
    expect(getFormatTimeString(withFormat('12'))).toBe('h:mm A');
  });

  it('uses a 24 hour pattern when the user asked for one', () => {
    expect(getFormatTimeString(withFormat('24'))).toBe('HH:mm');
  });

  it('falls back to the locale pattern', () => {
    expect(getFormatTimeString(undefined)).toBe('LT');
    expect(getFormatTimeString(withFormat())).toBe('LT');
  });
});

describe('getFormatDateTimeString', () => {
  it('puts the date before the time pattern', () => {
    expect(getFormatDateTimeString(withFormat('24'))).toBe('ll HH:mm');
    expect(getFormatDateTimeString(undefined)).toBe('ll LT');
  });
});

describe('getTimePickerFormat', () => {
  it('matches the user preference', () => {
    expect(getTimePickerFormat(withFormat('12'))).toBe('12h');
    expect(getTimePickerFormat(withFormat('24'))).toBe('24h');
  });

  it('defaults to 24 hours, since the locale does not say', () => {
    expect(getTimePickerFormat(undefined)).toBe('24h');
  });
});

describe('formatTime', () => {
  it('formats in the requested style', () => {
    expect(formatTime('2026-06-01T14:30:00', withFormat('24'))).toBe('14:30');
    expect(formatTime('2026-06-01T14:30:00', withFormat('12'))).toBe('2:30 PM');
  });
});

describe('formatDateTime', () => {
  it('includes both the date and the time', () => {
    const formatted = formatDateTime('2026-06-01T14:30:00', withFormat('24'));

    expect(formatted).toContain('14:30');
    expect(formatted).toContain('2026');
  });
});

// Picked times are stored as if they were UTC, so that what the user typed is
// what every viewer sees, regardless of their own time zone.
describe('fakeAsUtcString and convertSavedToBrowserDate', () => {
  it('appends the UTC marker when saving', () => {
    expect(fakeAsUtcString('2026-06-01T14:30:00')).toBe('2026-06-01T14:30:00Z');
  });

  it('returns an empty string for no date', () => {
    expect(fakeAsUtcString(undefined)).toBe('');
    expect(fakeAsUtcString('')).toBe('');
  });

  it('reads a saved value back as the same wall clock time', () => {
    expect(convertSavedToBrowserDate('2026-06-01 14:30:00.000Z')).toBe('2026-06-01T14:30:00');
  });

  it('returns nothing for no value', () => {
    expect(convertSavedToBrowserDate(undefined)).toBeUndefined();
  });

  it('round trips a picked time unchanged', () => {
    const picked = '2026-06-01T14:30:00';

    expect(convertSavedToBrowserDate(fakeAsUtcString(picked))).toBe(picked);
  });
});

describe('calculateTimezoneDifference', () => {
  it('reports the hours between the user and a destination', () => {
    const user = { timezone: 'UTC' } as User;

    // Tokyo runs ahead of UTC, so its clock shows a later hour
    expect(calculateTimezoneDifference(user, 'Asia/Tokyo')).toBeLessThan(0);
    // New York runs behind UTC
    expect(calculateTimezoneDifference(user, 'America/New_York')).toBeGreaterThan(0);
  });

  it('reports no difference for the same zone', () => {
    expect(calculateTimezoneDifference({ timezone: 'Europe/Paris' } as User, 'Europe/Paris')).toBe(0);
  });

  it('falls back to the browser zone when the user has none', () => {
    const guessed = dayjs.tz.guess();

    expect(calculateTimezoneDifference(undefined, guessed)).toBe(0);
  });
});
