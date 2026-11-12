import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPocketBase, listCall } from '../../helpers/pocketbase';

const client = createMockPocketBase();
vi.mock('../../../../src/lib/api/pocketbase/pocketbase', () => ({
  pb: client.pb,
  pbAdmin: client.pbAdmin,
  pocketBaseUrl: 'http://localhost',
  pocketBaseClients: { user: client.pb, admin: client.pbAdmin },
}));

const api = await import('../../../../src/lib/api/pocketbase/expenses');

const expenses = () => client.collection('trip_expenses');

beforeEach(() => client.reset());

describe('listExpenses', () => {
  it('filters to one trip, newest first', async () => {
    await api.listExpenses('t1');

    const { page, perPage, options } = listCall(expenses().getList);
    expect(page).toBe(1);
    expect(perPage).toBe(1000);
    expect(options.filter).toBe('trip="t1"');
    expect(options.sort).toBe('-occurredOn,-created');
  });

  it('asks for everything when no trip is given', async () => {
    await api.listExpenses();

    expect(listCall(expenses().getList).options.filter).toBeUndefined();
  });

  // Dates are stored as if UTC, so they are read back as the same wall clock time.
  it('converts stored dates for the browser', async () => {
    expenses().getList.mockResolvedValueOnce({
      items: [{ id: 'e1', name: 'Dinner', occurredOn: '2026-06-01 19:30:00.000Z' }],
      page: 1,
      perPage: 1000,
      totalItems: 1,
      totalPages: 1,
    });

    const [expense] = await api.listExpenses('t1');

    expect(expense.occurredOn).toBe('2026-06-01T19:30:00');
  });

  it('leaves an expense without a date alone', async () => {
    expenses().getList.mockResolvedValueOnce({
      items: [{ id: 'e1', name: 'Dinner', occurredOn: '' }],
      page: 1,
      perPage: 1000,
      totalItems: 1,
      totalPages: 1,
    });

    const [expense] = await api.listExpenses('t1');

    expect(expense.occurredOn).toBe('');
  });
});

describe('listExpensesByYear', () => {
  it("filters on the trip's start date within the year", async () => {
    await api.listExpensesByYear('2026');

    const filter = listCall(expenses().getList).options.filter ?? '';
    expect(filter).toContain('trip.startDate >=');
    expect(filter).toContain('trip.startDate <');
    expect(filter).toContain('2026');
  });
});

describe('createExpense', () => {
  it('sends the payload as given', async () => {
    await api.createExpense({ name: 'Dinner', trip: 't1' } as never);

    expect(expenses().create).toHaveBeenCalledWith({ name: 'Dinner', trip: 't1' });
  });
});

describe('updateExpense', () => {
  it('updates the named expense', async () => {
    await api.updateExpense('e1', { name: 'Lunch' } as never);

    expect(expenses().update).toHaveBeenCalledWith('e1', { name: 'Lunch' });
  });
});

describe('deleteExpense', () => {
  it('deletes the named expense', async () => {
    await api.deleteExpense('e1');

    expect(expenses().delete).toHaveBeenCalledWith('e1');
  });
});

describe('addAttachmentsToExpense', () => {
  it('uploads the files and appends their ids', async () => {
    client.collection('trip_attachments').create
      .mockResolvedValueOnce({ id: 'a1', name: 'one.pdf' })
      .mockResolvedValueOnce({ id: 'a2', name: 'two.pdf' });

    const result = await api.addAttachmentsToExpense({
      tripId: 't1',
      expenseId: 'e1',
      files: [new File(['one'], 'one.pdf'), new File(['two'], 'two.pdf')],
    });

    expect(expenses().update).toHaveBeenCalledWith('e1', { 'attachmentReferences+': ['a1', 'a2'] });
    expect(result.added.map((a) => a.id)).toEqual(['a1', 'a2']);
  });
});
