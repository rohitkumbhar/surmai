import { uploadAttachments } from './attachments.ts';
import { pb } from './pocketbase.ts';

import type { Attachment, CreateExpense, Expense } from '../../../types/trips.ts';

const expenses = pb.collection('trip_expenses');

export const listExpenses = async (tripId: string): Promise<Expense[]> => {
  const res = await expenses.getList<Expense>(1, 200, {
    filter: `trip="${tripId}"`,
    sort: '-occurredOn,-created',
  });
  return res.items as unknown as Expense[];
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
