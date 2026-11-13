import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Transportation, Trip } from '@src/types/trips';
import type { ReactElement } from 'react';

vi.mock('@src/lib/api', () => ({
  saveTransportation: vi.fn(),
  searchAirports: vi.fn(),
  searchAirlines: vi.fn(),
  getFlightRoute: vi.fn(),
}));

vi.mock('@src/lib/notifications.tsx', () => ({
  showErrorNotification: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

const api = await import('@src/lib/api');
const { FlightForm } = await import('@src/components/trip/transportation/FlightForm.tsx');
const { GenericTransportationModeForm } = await import(
  '@src/components/trip/transportation/GenericTransportationModeForm.tsx'
);

const trip = { id: 'trip-1', canUpdate: true } as unknown as Trip;

const sfo = { iataCode: 'SFO', name: 'San Francisco International' };
const lhr = { iataCode: 'LHR', name: 'Heathrow' };

const flight = {
  id: 'tr-1',
  origin: 'SFO',
  destination: 'LHR',
  departureTime: '2026-05-01T08:30:00',
  arrivalTime: '2026-05-01T22:45:00',
  link: 'https://example.test/booking',
  travellers: ['tp-1'],
  metadata: {
    origin: sfo,
    destination: lhr,
    provider: { name: 'Example Air', iataCode: 'EA' },
    reservation: 'ABC123',
    flightNumber: 'EA100',
    seats: '14A',
    notes: '  window seat  ',
  },
} as unknown as Transportation;

const renderForm = (ui: ReactElement) => render(<MantineProvider>{ui}</MantineProvider>);

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

const payload = () => vi.mocked(api.saveTransportation).mock.calls[0][1];

describe('FlightForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.saveTransportation).mockResolvedValue(undefined as never);
    vi.mocked(api.searchAirports).mockResolvedValue({ items: [] } as never);
    vi.mocked(api.searchAirlines).mockResolvedValue({ items: [] } as never);
  });

  it('sends the stored flight back unchanged, with the times as instants', async () => {
    const onSuccess = vi.fn();
    renderForm(
      <FlightForm
        trip={trip}
        transportation={flight}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        exitingAttachments={[{ id: 'att-1' }, { id: 'att-2' }] as never}
      />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.saveTransportation).mock.calls[0][0]).toBe('trip-1');
    expect(payload()).toMatchObject({
      entityId: 'tr-1',
      existingExpenseId: '',
      existingAttachmentIds: ['att-1', 'att-2'],
      entityData: {
        type: 'flight',
        origin: 'SFO',
        destination: 'LHR',
        departureTime: '2026-05-01T08:30:00Z',
        arrivalTime: '2026-05-01T22:45:00Z',
        link: 'https://example.test/booking',
        travellers: ['tp-1'],
        metadata: {
          origin: sfo,
          destination: lhr,
          flightNumber: 'EA100',
          reservation: 'ABC123',
          seats: '14A',
          // Trimmed on the way out.
          notes: 'window seat',
        },
      },
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('records no expense when the flight has no cost', async () => {
    renderForm(
      <FlightForm trip={trip} transportation={flight} onSuccess={vi.fn()} onCancel={vi.fn()} />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(payload().expense).toBeUndefined();
  });

  it('builds an expense named after the route when there is a cost', async () => {
    const expense = {
      id: 'exp-1',
      cost: { value: 850, currency: 'GBP' },
    } as unknown as Expense;

    renderForm(
      <FlightForm
        trip={trip}
        transportation={{ ...flight, expenseId: 'exp-1' } as unknown as Transportation}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map([['exp-1', expense]])}
      />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(payload().expense).toEqual({
      name: 'Flight: SFO to LHR',
      cost: { value: 850, currency: 'GBP' },
      occurredOn: '2026-05-01T08:30:00Z',
      category: 'transportation',
    });
    // The expense it already had is kept, so saving updates it instead of
    // leaving an orphan behind.
    expect(payload().existingExpenseId).toBe('exp-1');
  });

  it('forgets an expense id that is no longer among the trip expenses', async () => {
    renderForm(
      <FlightForm
        trip={trip}
        transportation={{ ...flight, expenseId: 'exp-gone' } as unknown as Transportation}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map()}
      />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(payload().existingExpenseId).toBe('');
  });

  it('looks a flight number up and fills in the route it comes back with', async () => {
    vi.mocked(api.getFlightRoute).mockResolvedValue({
      origin: sfo,
      destination: lhr,
      airline: { name: 'Example Air', iataCode: 'EA' },
    } as never);

    renderForm(<FlightForm trip={trip} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const flightNumber = screen.getByRole('textbox', { name: 'Flight Number' });
    await userEvent.type(flightNumber, 'EA100');
    await userEvent.tab();

    // The lookup is debounced.
    await waitFor(() => expect(api.getFlightRoute).toHaveBeenCalledWith('EA100'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByDisplayValue('SFO')).toBeDefined());
    expect(screen.getByDisplayValue('LHR')).toBeDefined();
  });

  it('does not look the flight number up again when it has not changed', async () => {
    renderForm(<FlightForm trip={trip} transportation={flight} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const flightNumber = screen.getByRole('textbox', { name: 'Flight Number' });
    await userEvent.click(flightNumber);
    await userEvent.tab();

    expect(api.getFlightRoute).not.toHaveBeenCalled();
  });
});

describe('GenericTransportationModeForm', () => {
  const train = {
    id: 'tr-2',
    origin: 'Paris Gare du Nord',
    destination: 'London St Pancras',
    departureTime: '2026-06-02T07:10:00',
    arrivalTime: '2026-06-02T08:39:00',
    travellers: [],
    metadata: {
      origin: 'Paris Gare du Nord',
      destination: 'London St Pancras',
      provider: 'Eurostar',
      reservation: 'EU-42',
      originAddress: '18 Rue de Dunkerque',
      destinationAddress: 'Euston Road',
      notes: 'coach 7',
    },
  } as unknown as Transportation;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.saveTransportation).mockResolvedValue(undefined as never);
  });

  it('saves with the type it was opened for and plain place names', async () => {
    renderForm(
      <GenericTransportationModeForm
        transportationType={'train'}
        trip={trip}
        transportation={train}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(payload()).toMatchObject({
      entityId: 'tr-2',
      entityData: {
        type: 'train',
        origin: 'Paris Gare du Nord',
        destination: 'London St Pancras',
        departureTime: '2026-06-02T07:10:00Z',
        arrivalTime: '2026-06-02T08:39:00Z',
        metadata: {
          provider: 'Eurostar',
          reservation: 'EU-42',
          originAddress: '18 Rue de Dunkerque',
          destinationAddress: 'Euston Road',
          notes: 'coach 7',
        },
      },
    });
    expect(payload().expense).toBeUndefined();
  });

  it('names the expense after the route', async () => {
    renderForm(
      <GenericTransportationModeForm
        transportationType={'car'}
        trip={trip}
        transportation={{ ...train, expenseId: 'exp-5' } as unknown as Transportation}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map([['exp-5', { id: 'exp-5', cost: { value: 60, currency: 'EUR' } } as unknown as Expense]])}
      />
    );

    await save();

    await waitFor(() => expect(api.saveTransportation).toHaveBeenCalledTimes(1));
    expect(payload().expense).toEqual({
      name: 'Transportation: Paris Gare du Nord -> London St Pancras',
      cost: { value: 60, currency: 'EUR' },
      occurredOn: '2026-06-02T07:10:00Z',
      category: 'transportation',
    });
  });
});
