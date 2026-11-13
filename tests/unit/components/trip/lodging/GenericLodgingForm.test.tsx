import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Lodging, Trip } from '@src/types/trips';
import type { ReactElement } from 'react';

vi.mock('@src/lib/api', () => ({
  saveLodging: vi.fn(),
  searchPlaces: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

// The form reaches for the i18n instance directly for two of its labels.
vi.mock('@src/lib/i18n.ts', () => ({
  default: { t: (_key: string, fallback: string) => fallback },
}));

const api = await import('@src/lib/api');
const { GenericLodgingForm } = await import('@src/components/trip/lodging/GenericLodgingForm.tsx');

const trip = { id: 'trip-1', canUpdate: true } as unknown as Trip;

const hotel = {
  id: 'lo-1',
  name: 'Hotel Bristol',
  address: '1 Rue de la Paix',
  startDate: '2026-07-04T15:00:00',
  endDate: '2026-07-08T11:00:00',
  confirmationCode: 'BR-77',
  link: 'https://example.test/hotel',
  travellers: ['tp-1', 'tp-2'],
  metadata: { place: { id: 'pl-1', name: 'Paris' }, notes: '  late arrival  ' },
} as unknown as Lodging;

const renderForm = (ui: ReactElement) => render(<MantineProvider>{ui}</MantineProvider>);
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));
const payload = () => vi.mocked(api.saveLodging).mock.calls[0][1];

describe('GenericLodgingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.saveLodging).mockResolvedValue(undefined as never);
    vi.mocked(api.searchPlaces).mockResolvedValue({ items: [] } as never);
  });

  it('saves the stored lodging with its dates as instants', async () => {
    const onSuccess = vi.fn();
    renderForm(
      <GenericLodgingForm
        trip={trip}
        type={'hotel'}
        lodging={hotel}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        exitingAttachments={[{ id: 'att-3' }] as never}
      />
    );

    await save();

    await waitFor(() => expect(api.saveLodging).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.saveLodging).mock.calls[0][0]).toBe('trip-1');
    expect(payload()).toMatchObject({
      entityId: 'lo-1',
      existingExpenseId: '',
      existingAttachmentIds: ['att-3'],
      entityData: {
        type: 'hotel',
        name: 'Hotel Bristol',
        address: '1 Rue de la Paix',
        startDate: '2026-07-04T15:00:00Z',
        endDate: '2026-07-08T11:00:00Z',
        confirmationCode: 'BR-77',
        link: 'https://example.test/hotel',
        travellers: ['tp-1', 'tp-2'],
        metadata: { place: { id: 'pl-1', name: 'Paris' }, notes: 'late arrival' },
      },
    });
    expect(payload().expense).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('records the expense against the check-in date', async () => {
    renderForm(
      <GenericLodgingForm
        trip={trip}
        type={'hotel'}
        lodging={{ ...hotel, expenseId: 'exp-2' } as unknown as Lodging}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={
          new Map([['exp-2', { id: 'exp-2', cost: { value: 940, currency: 'EUR' } } as unknown as Expense]])
        }
      />
    );

    await save();

    await waitFor(() => expect(api.saveLodging).toHaveBeenCalledTimes(1));
    expect(payload().expense).toEqual({
      name: 'Lodging: Hotel Bristol',
      cost: { value: 940, currency: 'EUR' },
      occurredOn: '2026-07-04T15:00:00Z',
      category: 'lodging',
    });
    expect(payload().existingExpenseId).toBe('exp-2');
  });

  it('forgets an expense id that is no longer among the trip expenses', async () => {
    renderForm(
      <GenericLodgingForm
        trip={trip}
        type={'rental'}
        lodging={{ ...hotel, expenseId: 'exp-gone' } as unknown as Lodging}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map()}
      />
    );

    await save();

    await waitFor(() => expect(api.saveLodging).toHaveBeenCalledTimes(1));
    expect(payload().existingExpenseId).toBe('');
    // The type comes from the menu entry the form was opened from, not the record.
    expect(payload().entityData).toMatchObject({ type: 'rental' });
  });

});
