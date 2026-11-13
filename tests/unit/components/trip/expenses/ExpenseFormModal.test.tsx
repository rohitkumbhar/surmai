import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@tests/unit/helpers/queryClient';

import type { Expense, TravellerProfile, Trip } from '@src/types/trips';
import type { ReactElement } from 'react';

vi.mock('@src/lib/api', () => ({
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  uploadAttachments: vi.fn(),
}));

vi.mock('@src/lib/notifications.tsx', () => ({
  showErrorNotification: vi.fn(),
  showDeleteNotification: vi.fn(),
}));

vi.mock('@mantine/modals', () => ({
  openConfirmModal: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, vars?: Record<string, unknown>) =>
      vars ? fallback.replace(/{{(\w+)}}/g, (_m: string, name: string) => String(vars[name] ?? '')) : fallback,
  }),
}));

const api = await import('@src/lib/api');
const { openConfirmModal } = await import('@mantine/modals');
const { ExpenseFormModal } = await import('@src/components/trip/expenses/ExpenseFormModal.tsx');

const trip = { id: 'trip-1', canUpdate: true, budget: { value: 0, currency: 'EUR' } } as unknown as Trip;

const travellers = [
  { id: 'tp-1', legalName: 'Ada Lovelace' },
  { id: 'tp-2', legalName: 'Alan Turing' },
  { id: 'tp-3', legalName: 'Grace Hopper' },
] as unknown as TravellerProfile[];

const renderModal = (ui: ReactElement) =>
  render(
    <MantineProvider>
      <QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>
    </MantineProvider>
  );

const open = (props: Partial<Parameters<typeof ExpenseFormModal>[0]> = {}) =>
  renderModal(
    <ExpenseFormModal
      opened={true}
      onClose={props.onClose ?? vi.fn()}
      trip={trip}
      expense={props.expense ?? null}
      tripAttachments={props.tripAttachments}
      tripTravellers={props.tripTravellers ?? []}
      isMobile={false}
    />
  );

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('ExpenseFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.uploadAttachments).mockResolvedValue([]);
    vi.mocked(api.createExpense).mockResolvedValue(undefined as never);
    vi.mocked(api.updateExpense).mockResolvedValue(undefined as never);
  });

  it('creates an expense from the entered values', async () => {
    open();

    // The name is trimmed, and the currency defaults to the trip's budget.
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '  Dinner  ');
    await userEvent.type(screen.getByLabelText('Amount'), '42');
    await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), ' a note ');
    await save();

    await waitFor(() => expect(api.createExpense).toHaveBeenCalledTimes(1));
    expect(api.createExpense).toHaveBeenCalledWith({
      name: 'Dinner',
      trip: 'trip-1',
      cost: { value: 42, currency: 'EUR' },
      occurredOn: undefined,
      notes: 'a note',
      category: undefined,
      attachmentReferences: [],
      splits: undefined,
    });
    expect(api.updateExpense).not.toHaveBeenCalled();
  });

  it('does not submit without a name and an amount', async () => {
    open();

    await save();
    expect(api.createExpense).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Taxi');
    await save();
    expect(api.createExpense).not.toHaveBeenCalled();
  });

  it('updates an existing expense and keeps the attachments it already references', async () => {
    const expense = {
      id: 'exp-9',
      name: 'Hotel',
      cost: { value: 120, currency: 'USD' },
      occurredOn: '2026-03-04',
      notes: 'paid at checkout',
      category: 'lodging',
      attachmentReferences: ['att-1'],
    } as unknown as Expense;

    open({
      expense,
      tripAttachments: [
        { id: 'att-1', name: 'receipt.pdf' },
        { id: 'att-2', name: 'unrelated.pdf' },
      ] as never,
    });

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Hotel'));
    await save();

    await waitFor(() => expect(api.updateExpense).toHaveBeenCalledTimes(1));
    expect(api.updateExpense).toHaveBeenCalledWith('exp-9', {
      name: 'Hotel',
      trip: 'trip-1',
      cost: { value: 120, currency: 'USD' },
      // The stored date is sent back as an instant, not shifted by the browser's zone.
      occurredOn: '2026-03-04T00:00:00Z',
      notes: 'paid at checkout',
      category: 'lodging',
      attachmentReferences: ['att-1'],
      splits: undefined,
    });
    expect(api.createExpense).not.toHaveBeenCalled();
  });

  it('asks to delete through a confirmation rather than deleting outright', async () => {
    open({ expense: { id: 'exp-9', name: 'Hotel', cost: { value: 1, currency: 'USD' } } as unknown as Expense });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(api.deleteExpense).not.toHaveBeenCalled();
    expect(openConfirmModal).toHaveBeenCalledTimes(1);
  });

  describe('splitting between travellers', () => {
    it('is not offered when the trip has no travellers', () => {
      open({ tripTravellers: [] });
      expect(screen.queryByRole('switch', { name: 'Split expense' })).toBeNull();
    });

    it('seeds an even split and puts the rounding remainder on the first traveller', async () => {
      open({ tripTravellers: travellers });

      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Groceries');
      await userEvent.type(screen.getByLabelText('Amount'), '100');
      await userEvent.click(screen.getByRole('switch', { name: 'Split expense' }));

      // 100 over three people is 33.33 each, so the first one carries the extra cent.
      expect(screen.getByDisplayValue('33.34')).toBeDefined();
      expect(screen.getAllByDisplayValue('33.33')).toHaveLength(2);
      expect(screen.getByText(/Split total: 100.00 EUR/)).toBeDefined();

      await save();

      await waitFor(() => expect(api.createExpense).toHaveBeenCalledTimes(1));
      expect(vi.mocked(api.createExpense).mock.calls[0][0].splits).toEqual([
        { travellerId: 'tp-1', amount: 33.34 },
        { travellerId: 'tp-2', amount: 33.33 },
        { travellerId: 'tp-3', amount: 33.33 },
      ]);
    });

    it('refuses to save when the splits do not add up to the total', async () => {
      open({ tripTravellers: travellers.slice(0, 2) });

      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Groceries');
      await userEvent.type(screen.getByLabelText('Amount'), '100');
      await userEvent.click(screen.getByRole('switch', { name: 'Split expense' }));

      // Clearing one person's share leaves the splits short of the total.
      const [first] = screen.getAllByDisplayValue('50');
      await userEvent.clear(first);

      await save();

      expect(api.createExpense).not.toHaveBeenCalled();
      expect(screen.getByText('Sum of splits (50.00) must equal the total cost (100.00)')).toBeDefined();
    });

    it('drops the splits again when the switch is turned back off', async () => {
      open({ tripTravellers: travellers.slice(0, 2) });

      await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Groceries');
      await userEvent.type(screen.getByLabelText('Amount'), '100');

      const toggle = screen.getByRole('switch', { name: 'Split expense' });
      await userEvent.click(toggle);
      expect(screen.getAllByDisplayValue('50')).toHaveLength(2);

      await userEvent.click(toggle);
      await save();

      await waitFor(() => expect(api.createExpense).toHaveBeenCalledTimes(1));
      expect(vi.mocked(api.createExpense).mock.calls[0][0].splits).toBeUndefined();
    });

    it('fills the splits in from an expense that was already split', async () => {
      open({
        tripTravellers: travellers.slice(0, 2),
        expense: {
          id: 'exp-3',
          name: 'Taxi',
          cost: { value: 30, currency: 'USD' },
          splits: [
            { travellerId: 'tp-1', amount: 20 },
            { travellerId: 'tp-2', amount: 10 },
          ],
        } as unknown as Expense,
      });

      await waitFor(() => expect(screen.getByRole('switch', { name: 'Split expense' })).toBeChecked());
      expect(screen.getByDisplayValue('20')).toBeDefined();
      expect(screen.getByDisplayValue('10')).toBeDefined();

      await save();

      await waitFor(() => expect(api.updateExpense).toHaveBeenCalledTimes(1));
      expect(vi.mocked(api.updateExpense).mock.calls[0][1].splits).toEqual([
        { travellerId: 'tp-1', amount: 20 },
        { travellerId: 'tp-2', amount: 10 },
      ]);
    });
  });
});
