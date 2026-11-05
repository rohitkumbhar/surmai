import { describe, expect, it } from 'vitest';

import { countNights } from '../../../src/lib/time';

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
