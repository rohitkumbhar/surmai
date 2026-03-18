import { uploadAttachments } from './attachments.ts';
import { pb } from './pocketbase.ts';
import { convertSavedToBrowserDate } from '../../time.ts';

import type { Attachment, CreateExpense, Expense } from '../../../types/trips.ts';

const expenses = pb.collection('trip_expenses');

export const listExpenses = async (tripId?: string): Promise<Expense[]> => {
  const filter = tripId ? `trip="${tripId}"` : undefined;
  const res = await expenses.getList<Expense>(1, 1000, {
    filter,
    sort: '-occurredOn,-created',
  });
  return res.items.map((entry) => {
    return {
      ...entry,
      occurredOn: entry.occurredOn ? convertSavedToBrowserDate(entry.occurredOn) : entry.occurredOn,
    } as unknown as Expense;
  });
};

export const listExpensesByYear = async (year: string): Promise<Expense[]> => {
  const filter = `trip.startDate >= "${year}-01-01 00:00:00" && trip.startDate <= "${year}-12-31 23:59:59"`;
  const res = await expenses.getList<Expense>(1, 1000, {
    filter,
    sort: '-occurredOn,-created',
  });
  return res.items.map((entry) => {
    return {
      ...entry,
      occurredOn: entry.occurredOn ? convertSavedToBrowserDate(entry.occurredOn) : entry.occurredOn,
    } as unknown as Expense;
  });
};

export const createExpense = async (payload: CreateExpense): Promise<Expense> => {
  return (await expenses.create(payload)) as Expense;
};

export const updateExpense = async (expenseId: string, payload: Partial<CreateExpense>): Promise<Expense> => {
  return (await expenses.update(expenseId, payload)) as Expense;
};

export const deleteExpense = async (expenseId: string) => {
  return expenses.delete(expenseId);
};

export const addAttachmentsToExpense = async (params: {
  tripId: string;
  expenseId: string;
  files: File[];
}): Promise<{ added: Attachment[] }> => {
  const { tripId, expenseId, files } = params;
  const uploaded = await uploadAttachments(tripId, files);
  const ids = uploaded.map((a) => a.id);
  await expenses.update(expenseId, {
    'attachmentReferences+': ids,
  });
  return { added: uploaded };
};
