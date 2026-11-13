import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Activity, Lodging, Transportation, TravellerProfile, Trip } from '@src/types/trips';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const download = vi.fn((_fileName?: string) => undefined);
const createPdf = vi.fn((_definition: unknown) => ({ download }));

vi.mock('pdfmake/build/pdfmake', () => ({ default: { createPdf, vfs: {} } }));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: { vfs: {} } }));

vi.mock('i18next', () => ({
  default: { t: (_key: string, fallback: string) => fallback, language: 'en' },
}));

const { downloadFullItinerary, downloadDailyItinerary } = await import(
  '@src/components/trip/itinerary/pdfGenerator.ts'
);

const trip = {
  id: 'trip-1',
  name: 'Paris 2026',
  description: 'A week off',
  startDate: '2026-07-04T00:00:00',
  endDate: '2026-07-07T00:00:00',
  destinations: [{ id: 'pl-1', name: 'Paris' }, { id: 'pl-2', name: 'Versailles' }],
  participants: [{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }],
} as unknown as Trip;

const flight = {
  id: 'tr-1',
  type: 'flight',
  origin: 'SFO',
  destination: 'CDG',
  departureTime: '2026-07-04T08:00:00',
  arrivalTime: '2026-07-04T12:00:00',
  metadata: { origin: { iataCode: 'SFO' }, destination: { iataCode: 'CDG' }, flightNumber: 'EA100' },
} as unknown as Transportation;

const hotel = {
  id: 'lo-1',
  type: 'hotel',
  name: 'Hotel Bristol',
  startDate: '2026-07-04T15:00:00',
  endDate: '2026-07-06T11:00:00',
} as unknown as Lodging;

const museum = {
  id: 'ac-1',
  name: 'Musee d Orsay',
  startDate: '2026-07-05T10:00:00',
  endDate: '2026-07-05T13:00:00',
} as unknown as Activity;

const travellers = [{ id: 'tp-1', legalName: 'Ada Lovelace' }] as unknown as TravellerProfile[];

const definition = (): TDocumentDefinitions => createPdf.mock.calls[0][0] as unknown as TDocumentDefinitions;
const items = () => definition().content as unknown as Record<string, unknown>[];
const fileName = () => download.mock.calls[0][0] as string;

/** The index of the first content block mentioning `marker` anywhere inside it. */
const indexOf = (marker: string) => items().findIndex((item) => JSON.stringify(item).includes(marker));

const dayHeaders = () =>
  items()
    .filter((item) => {
      const table = item.table as { body?: { style?: string; text?: string }[][][] } | undefined;
      return table?.body?.[0]?.[0] !== undefined && (table.body[0][0] as { style?: string }).style === 'dayHeader';
    })
    .map((item) => {
      const cell = (item.table as { body: { text: string }[][][] }).body[0][0] as unknown as { text: string };
      return { text: cell.text, pageBreak: item.pageBreak };
    });

describe('downloadFullItinerary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens with the trip, its destinations and its travellers', () => {
    downloadFullItinerary(trip, [flight], [hotel], [museum], undefined, travellers);

    expect(createPdf).toHaveBeenCalledTimes(1);
    expect(items()[0]).toMatchObject({ text: 'Paris 2026', style: 'header' });
    expect(items()[1]).toMatchObject({ text: 'A week off', style: 'subheader' });
    expect(items()[2]).toMatchObject({ text: 'Jul 4, 2026 - Jul 7, 2026' });

    // Destinations and participants can be stored as objects or bare strings.
    expect(items()[indexOf('"Versailles"')]).toMatchObject({ ul: ['Paris', 'Versailles'] });
    expect(items()[indexOf('Ada Lovelace, Alan Turing')]).toMatchObject({
      text: 'Ada Lovelace, Alan Turing',
    });
    expect(fileName()).toBe('Paris 2026_Full_Itinerary.pdf');
  });

  it('leaves out the destination and traveller sections when the trip has neither', () => {
    downloadFullItinerary(
      { ...trip, destinations: [], participants: [] } as unknown as Trip,
      [],
      [],
      [],
      undefined
    );

    expect(indexOf('Destinations')).toBe(-1);
    expect(indexOf('Travelers')).toBe(-1);
  });

  it('puts the events in order however they were passed in', () => {
    downloadFullItinerary(trip, [flight], [hotel], [museum], undefined, travellers);

    const flightAt = indexOf('EA100');
    const hotelAt = indexOf('Hotel Bristol');
    const museumAt = indexOf('Musee d Orsay');

    expect(flightAt).toBeGreaterThan(-1);
    // 4 Jul 08:00 flight, 4 Jul 15:00 check-in, 5 Jul 10:00 museum.
    expect(flightAt).toBeLessThan(hotelAt);
    expect(hotelAt).toBeLessThan(museumAt);
  });

  it('appends the notes on a new page, converted from their html', () => {
    downloadFullItinerary(
      { ...trip, notes: '<p>Bring an <strong>adapter</strong></p>' } as unknown as Trip,
      [],
      [],
      [],
      undefined
    );

    const notesAt = indexOf('"Notes"');
    expect(items()[notesAt]).toMatchObject({ style: 'sectionHeader', pageBreak: 'before' });
    expect(JSON.stringify(items().slice(notesAt))).toContain('"bold":true');
    expect(JSON.stringify(items().slice(notesAt))).toContain('adapter');
  });

  it('has no notes section when the trip has none', () => {
    downloadFullItinerary(trip, [], [], [], undefined);
    expect(indexOf('"Notes"')).toBe(-1);
  });
});

describe('how each kind of entry is laid out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels a car rental by pickup and drop off rather than departure and arrival', () => {
    const rental = {
      id: 'tr-9',
      type: 'rental_car',
      origin: { name: 'CDG Terminal 2' },
      destination: 'Gare de Lyon',
      departureTime: '2026-07-04T09:00:00',
      arrivalTime: '2026-07-06T18:00:00',
      metadata: { rentalCompany: { name: 'Example Rentals' }, reservation: 'RC-5' },
    } as unknown as Transportation;

    downloadFullItinerary(trip, [rental], [], [], undefined, travellers);

    const block = JSON.stringify(items()[indexOf('Example Rentals')]);
    expect(block).toContain('CAR RENTAL');
    expect(block).toContain('Pickup');
    expect(block).toContain('Drop Off');
    expect(block).toContain('Pickup Location: CDG Terminal 2');
    // A bare string stands in for a place that was never looked up.
    expect(block).toContain('Drop Off Location: Gare de Lyon');
    expect(block).toContain('Confirmation Code: RC-5');
  });

  it('heads other journeys with their own type', () => {
    const train = {
      id: 'tr-8',
      type: 'train',
      origin: 'Gare du Nord',
      destination: 'St Pancras',
      departureTime: '2026-07-05T07:10:00',
      arrivalTime: '2026-07-05T08:39:00',
      metadata: { provider: 'Eurostar', reservation: 'EU-42' },
    } as unknown as Transportation;

    downloadFullItinerary(trip, [train], [], [], undefined, travellers);

    const block = JSON.stringify(items()[indexOf('Eurostar')]);
    expect(block).toContain('TRAIN');
    expect(block).toContain('Provider: Eurostar');
    expect(block).toContain('Reservation: EU-42');
  });

  it('names the travellers an entry is for, and only them', () => {
    const twoTravellers = [
      { id: 'tp-1', legalName: 'Ada Lovelace' },
      { id: 'tp-2', legalName: 'Alan Turing' },
    ] as unknown as TravellerProfile[];

    downloadFullItinerary(
      trip,
      [{ ...flight, travellers: ['tp-2'] } as unknown as Transportation],
      [],
      [],
      undefined,
      twoTravellers
    );

    const block = JSON.stringify(items()[indexOf('EA100')]);
    expect(block).toContain('Alan Turing');
    expect(block).not.toContain('Ada Lovelace');
  });
});

describe('downloadDailyItinerary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gives every day with something on it a header, and skips the empty ones', () => {
    downloadDailyItinerary(trip, [flight], [hotel], [museum], undefined, travellers);

    // The trip runs 4 to 7 July; nothing happens on the 7th.
    expect(dayHeaders().map((h) => h.text)).toEqual([
      'Saturday, July 4, 2026',
      'Sunday, July 5, 2026',
      'Monday, July 6, 2026',
    ]);
    expect(fileName()).toBe('Paris 2026_Daily_Itinerary.pdf');
  });

  it('starts each day after the first on a new page', () => {
    downloadDailyItinerary(trip, [flight], [hotel], [museum], undefined, travellers);

    expect(dayHeaders().map((h) => h.pageBreak)).toEqual([undefined, 'before', 'before']);
  });

  it('repeats a stay on every day it covers, including the days in between', () => {
    downloadDailyItinerary(trip, [], [hotel], [], undefined, travellers);

    // Check-in on the 4th, a night on the 5th with neither end on that day,
    // and check-out on the 6th.
    expect(dayHeaders()).toHaveLength(3);
    expect(items().filter((item) => JSON.stringify(item).includes('Hotel Bristol'))).toHaveLength(3);
  });

  it('shows an activity only on the day it starts', () => {
    downloadDailyItinerary(trip, [], [], [museum], undefined, travellers);

    expect(dayHeaders().map((h) => h.text)).toEqual(['Sunday, July 5, 2026']);
    expect(items().filter((item) => JSON.stringify(item).includes('Musee d Orsay'))).toHaveLength(1);
  });

  it('shows an overnight journey on both the day it leaves and the day it lands', () => {
    const overnight = {
      ...flight,
      departureTime: '2026-07-05T22:00:00',
      arrivalTime: '2026-07-06T07:00:00',
    } as unknown as Transportation;

    downloadDailyItinerary(trip, [overnight], [], [], undefined, travellers);

    expect(dayHeaders().map((h) => h.text)).toEqual(['Sunday, July 5, 2026', 'Monday, July 6, 2026']);
  });

  it('produces only the heading when nothing falls inside the trip', () => {
    downloadDailyItinerary(trip, [], [], [], undefined);

    expect(dayHeaders()).toHaveLength(0);
    expect(items()[3]).toMatchObject({ text: 'Daily Itinerary', style: 'sectionHeader' });
    expect(download).toHaveBeenCalledTimes(1);
  });
});
