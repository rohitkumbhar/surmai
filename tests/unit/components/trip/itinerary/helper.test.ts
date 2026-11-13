import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  buildActivitiesIndex,
  buildLodgingIndex,
  buildTransportationIndex,
  chunk,
  compareItineraryLine,
} from '@src/components/trip/itinerary/helper';

import type { Activity, ItineraryLine, Lodging, Transportation } from '@src/types/trips';

const dayKey = (date: string) => dayjs(date).startOf('day').toISOString();

describe('buildTransportationIndex', () => {
  it('files a journey under the day it departs', () => {
    const index = buildTransportationIndex([
      {
        id: 'tr1',
        type: 'flight',
        departureTime: '2026-06-01T10:00:00',
        arrivalTime: '2026-06-01T14:00:00',
      },
    ] as unknown as Transportation[]);

    expect(Object.keys(index)).toEqual([dayKey('2026-06-01')]);
    expect(index[dayKey('2026-06-01')]).toHaveLength(1);
  });

  // An overnight flight shows on both days of the itinerary.
  it('files a journey under every day it spans', () => {
    const index = buildTransportationIndex([
      {
        id: 'tr1',
        type: 'flight',
        departureTime: '2026-06-01T22:00:00',
        arrivalTime: '2026-06-03T06:00:00',
      },
    ] as unknown as Transportation[]);

    expect(Object.keys(index).sort()).toEqual(
      [dayKey('2026-06-01'), dayKey('2026-06-02'), dayKey('2026-06-03')].sort()
    );
  });

  it('does not list the same journey twice on a day', () => {
    const index = buildTransportationIndex([
      { id: 'tr1', type: 'flight', departureTime: '2026-06-01T10:00:00', arrivalTime: '2026-06-01T14:00:00' },
      { id: 'tr1', type: 'flight', departureTime: '2026-06-01T10:00:00', arrivalTime: '2026-06-01T14:00:00' },
    ] as unknown as Transportation[]);

    expect(index[dayKey('2026-06-01')]).toHaveLength(1);
  });

  it('groups several journeys on the same day', () => {
    const index = buildTransportationIndex([
      { id: 'tr1', type: 'flight', departureTime: '2026-06-01T08:00:00', arrivalTime: '2026-06-01T10:00:00' },
      { id: 'tr2', type: 'train', departureTime: '2026-06-01T15:00:00', arrivalTime: '2026-06-01T17:00:00' },
    ] as unknown as Transportation[]);

    expect(index[dayKey('2026-06-01')].map((t) => t.id)).toEqual(['tr1', 'tr2']);
  });

  it('handles an empty list', () => {
    expect(buildTransportationIndex([])).toEqual({});
  });
});

describe('buildLodgingIndex', () => {
  it('files a stay under every day it covers', () => {
    const index = buildLodgingIndex([
      { id: 'l1', type: 'hotel', startDate: '2026-06-01T15:00:00', endDate: '2026-06-03T11:00:00' },
    ] as unknown as Lodging[]);

    expect(Object.keys(index).sort()).toEqual(
      [dayKey('2026-06-01'), dayKey('2026-06-02'), dayKey('2026-06-03')].sort()
    );
  });

  it('files overlapping stays under the shared day', () => {
    const index = buildLodgingIndex([
      { id: 'l1', type: 'hotel', startDate: '2026-06-01T15:00:00', endDate: '2026-06-02T11:00:00' },
      { id: 'l2', type: 'home', startDate: '2026-06-02T18:00:00', endDate: '2026-06-03T09:00:00' },
    ] as unknown as Lodging[]);

    expect(index[dayKey('2026-06-02')].map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('handles an empty list', () => {
    expect(buildLodgingIndex([])).toEqual({});
  });
});

describe('buildActivitiesIndex', () => {
  it('files an activity under its start day only', () => {
    const index = buildActivitiesIndex([
      { id: 'a1', name: 'Louvre', startDate: '2026-06-02T09:00:00', endDate: '2026-06-02T12:00:00' },
    ] as unknown as Activity[]);

    expect(Object.keys(index)).toEqual([dayKey('2026-06-02')]);
  });

  it('groups activities that share a day', () => {
    const index = buildActivitiesIndex([
      { id: 'a1', name: 'Louvre', startDate: '2026-06-02T09:00:00' },
      { id: 'a2', name: 'Dinner', startDate: '2026-06-02T19:00:00' },
      { id: 'a3', name: 'Orsay', startDate: '2026-06-03T09:00:00' },
    ] as unknown as Activity[]);

    expect(index[dayKey('2026-06-02')].map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(index[dayKey('2026-06-03')].map((a) => a.id)).toEqual(['a3']);
  });

  it('handles an empty list', () => {
    expect(buildActivitiesIndex([])).toEqual({});
  });
});

describe('chunk', () => {
  it('splits into equal groups', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('leaves a short final group', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns one group when the size exceeds the length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('returns nothing for an empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('compareItineraryLine', () => {
  it('orders by departure time', () => {
    const earlier = { id: 'a', departureTime: '2026-06-01T08:00:00' } as unknown as ItineraryLine;
    const later = { id: 'b', departureTime: '2026-06-01T12:00:00' } as unknown as ItineraryLine;

    expect(compareItineraryLine(earlier, later)).toBeLessThan(0);
    expect(compareItineraryLine(later, earlier)).toBeGreaterThan(0);
  });

  it('orders a departure against a start date', () => {
    const flight = { id: 'a', departureTime: '2026-06-01T08:00:00' } as unknown as ItineraryLine;
    const activity = { id: 'b', startDate: '2026-06-01T10:00:00' } as unknown as ItineraryLine;

    expect(compareItineraryLine(flight, activity)).toBeLessThan(0);
  });

  it('sorts a mixed day into chronological order', () => {
    const lines = [
      { id: 'dinner', startDate: '2026-06-01T19:00:00' },
      { id: 'flight', departureTime: '2026-06-01T08:00:00' },
      { id: 'museum', startDate: '2026-06-01T13:00:00' },
    ] as unknown as ItineraryLine[];

    expect([...lines].sort(compareItineraryLine).map((l) => l.id)).toEqual(['flight', 'museum', 'dinner']);
  });

  it('treats equal times as equal', () => {
    const first = { id: 'a', startDate: '2026-06-01T08:00:00' } as unknown as ItineraryLine;
    const second = { id: 'b', startDate: '2026-06-01T08:00:00' } as unknown as ItineraryLine;

    expect(compareItineraryLine(first, second)).toBe(0);
  });
});
