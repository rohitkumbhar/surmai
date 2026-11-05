import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';

import { countNights, travelMinutes } from '../../../src/lib/time';

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
