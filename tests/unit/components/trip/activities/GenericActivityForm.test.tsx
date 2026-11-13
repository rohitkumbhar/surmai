import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Activity, Expense, Trip } from '@src/types/trips';
import type { ReactElement } from 'react';

vi.mock('@src/lib/api', () => ({
  saveActivity: vi.fn(),
  searchPlaces: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@src/lib/i18n.ts', () => ({
  default: { t: (_key: string, fallback: string) => fallback },
}));

const api = await import('@src/lib/api');
const { GenericActivityForm } = await import('@src/components/trip/activities/GenericActivityForm.tsx');

const trip = { id: 'trip-1', canUpdate: true } as unknown as Trip;

const museum = {
  id: 'ac-1',
  name: 'Musée d’Orsay',
  description: 'Impressionist collection',
  address: '1 Rue de la Légion d’Honneur',
  startDate: '2026-07-05T10:00:00',
  endDate: '2026-07-05T13:00:00',
  link: 'https://example.test/orsay',
  travellers: ['tp-1'],
  metadata: { place: { id: 'pl-1', name: 'Paris' } },
} as unknown as Activity;

const renderForm = (ui: ReactElement) => render(<MantineProvider>{ui}</MantineProvider>);
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));
const payload = () => vi.mocked(api.saveActivity).mock.calls[0][1];

describe('GenericActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.saveActivity).mockResolvedValue(undefined as never);
    vi.mocked(api.searchPlaces).mockResolvedValue({ items: [] } as never);
  });

  it('saves the stored activity with its dates as instants', async () => {
    const onSuccess = vi.fn();
    renderForm(
      <GenericActivityForm
        trip={trip}
        activity={museum}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        exitingAttachments={[{ id: 'att-4' }] as never}
      />
    );

    await save();

    await waitFor(() => expect(api.saveActivity).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.saveActivity).mock.calls[0][0]).toBe('trip-1');
    expect(payload()).toMatchObject({
      entityId: 'ac-1',
      existingExpenseId: '',
      existingAttachmentIds: ['att-4'],
      entityData: {
        name: 'Musée d’Orsay',
        description: 'Impressionist collection',
        address: '1 Rue de la Légion d’Honneur',
        startDate: '2026-07-05T10:00:00Z',
        endDate: '2026-07-05T13:00:00Z',
        link: 'https://example.test/orsay',
        travellers: ['tp-1'],
        metadata: { place: { id: 'pl-1', name: 'Paris' } },
      },
    });
    expect(payload().expense).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('records the expense against the start date under the activities category', async () => {
    renderForm(
      <GenericActivityForm
        trip={trip}
        activity={{ ...museum, expenseId: 'exp-7' } as unknown as Activity}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map([['exp-7', { id: 'exp-7', cost: { value: 32, currency: 'EUR' } } as unknown as Expense]])}
      />
    );

    await save();

    await waitFor(() => expect(api.saveActivity).toHaveBeenCalledTimes(1));
    expect(payload().expense).toEqual({
      name: 'Activity: Musée d’Orsay',
      cost: { value: 32, currency: 'EUR' },
      occurredOn: '2026-07-05T10:00:00Z',
      category: 'activities',
    });
    expect(payload().existingExpenseId).toBe('exp-7');
  });

  it('forgets an expense id that is no longer among the trip expenses', async () => {
    renderForm(
      <GenericActivityForm
        trip={trip}
        activity={{ ...museum, expenseId: 'exp-gone' } as unknown as Activity}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        expenseMap={new Map()}
      />
    );

    await save();

    await waitFor(() => expect(api.saveActivity).toHaveBeenCalledTimes(1));
    expect(payload().existingExpenseId).toBe('');
  });
});
