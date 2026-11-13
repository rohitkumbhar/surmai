import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { countNights, startDateInYearFilter, travelMinutes } from '@src/lib/time';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('countNights', () => {
  it('counts calendar days when check-out is later in the day than check-in', () => {
    expect(countNights('2026-11-12T11:00:00', '2026-11-14T15:00:00')).toBe(2);
  });

  it('counts an overnight stay shorter than 24 hours as one night', () => {
    expect(countNights('2026-11-15T14:00:00', '2026-11-16T10:00:00')).toBe(1);
  });

  it('counts a stay within one day as one night', () => {
    expect(countNights('2026-11-15T01:00:00', '2026-11-15T10:00:00')).toBe(1);
  });

  it('returns 0 when the end is not after the start', () => {
    expect(countNights('2026-11-15T10:00:00', '2026-11-15T10:00:00')).toBe(0);
  });
});

describe('travelMinutes', () => {
  it('takes the time zone change out of a flight between two zones', () => {
    expect(travelMinutes('2026-11-12T10:00:00', '2026-11-12T22:00:00', 'America/New_York', 'Europe/London')).toBe(420);
  });

  it('uses the local times when a timezone is missing', () => {
    expect(travelMinutes('2026-11-12T10:00:00', '2026-11-12T22:00:00', 'America/New_York')).toBe(720);
  });
});

describe('startDateInYearFilter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts and ends the year at midnight in the browser timezone', () => {
    vi.stubEnv('TZ', 'Asia/Dhaka');
    expect(startDateInYearFilter('startDate', '2027')).toBe(
      'startDate >= "2026-12-31 18:00:00.000Z" && startDate < "2027-12-31 18:00:00.000Z"'
    );
  });
});
