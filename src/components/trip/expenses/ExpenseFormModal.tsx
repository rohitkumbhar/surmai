import { Button, Grid, Group, Modal, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ExpenseSplitSection } from './ExpenseSplitSection.tsx';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { createExpense, deleteExpense, updateExpense, uploadAttachments } from '../../../lib/api';
import { showDeleteNotification, showErrorNotification } from '../../../lib/notifications.tsx';
import { fakeAsUtcString } from '../../../lib/time.ts';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { AttachmentsUploadField } from '../attachments/AttachmentsUploadField.tsx';

import type {
  Attachment,
  CreateExpense,
  Expense,
  ExpenseFormSchema,
  TravellerProfile,
  Trip,
} from '../../../types/trips.ts';

const EXPENSE_CATEGORY_DATA: Record<string, { labelKey: string; defaultLabel: string; color: string }> = {
  lodging: { labelKey: 'expense_category_lodging', defaultLabel: 'Lodging', color: 'blue' },
  transportation: { labelKey: 'expense_category_transportation', defaultLabel: 'Transportation', color: 'cyan' },
  food: { labelKey: 'expense_category_food', defaultLabel: 'Food', color: 'teal' },
  entertainment: { labelKey: 'expense_category_entertainment', defaultLabel: 'Entertainment', color: 'green' },
  shopping: { labelKey: 'expense_category_shopping', defaultLabel: 'Shopping', color: 'lime' },
  activities: { labelKey: 'expense_category_activities', defaultLabel: 'Activities', color: 'yellow' },
  healthcare: { labelKey: 'expense_category_healthcare', defaultLabel: 'Healthcare', color: 'orange' },
  communication: { labelKey: 'expense_category_communication', defaultLabel: 'Communication', color: 'red' },
  insurance: { labelKey: 'expense_category_insurance', defaultLabel: 'Insurance', color: 'red' },
  visa_fees: { labelKey: 'expense_category_visa_fees', defaultLabel: 'Visa Fees', color: 'pink' },
  souvenirs: { labelKey: 'expense_category_souvenirs', defaultLabel: 'Souvenirs', color: 'grape' },
  tips: { labelKey: 'expense_category_tips', defaultLabel: 'Tips', color: 'violet' },
  other: { labelKey: 'expense_category_other', defaultLabel: 'Other', color: 'indigo' },
};

export const ExpenseFormModal = ({
  opened,
  onClose,
  trip,
  expense,
  tripAttachments,
  tripTravellers,
  isMobile,
}: {
  opened: boolean;
  onClose: () => void;
  trip: Trip;
  expense: Expense | null;
  tripAttachments?: Attachment[];
  tripTravellers: TravellerProfile[];
  isMobile: boolean;
}) => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const defaultCurrency = trip.budget?.currency || user?.currencyCode || 'USD';

  const form = useForm<ExpenseFormSchema>({
    initialValues: {
      name: '',
      amount: '',
      currency: defaultCurrency,
      occurredOn: null,
      notes: '',
      category: null,
      splitEnabled: false,
      splits: [],
    },
    validate: {
      splits: (_value, values) => {
        if (!values.splitEnabled) return null;
        const total = typeof values.amount === 'number' ? values.amount : 0;
        const splitSum = Math.round(values.splits.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
        const roundedTotal = Math.round(total * 100) / 100;
        if (splitSum !== roundedTotal) {
          return t('split_sum_mismatch', 'Sum of splits ({{splitSum}}) must equal the total cost ({{total}})', {
            splitSum: splitSum.toFixed(2),
            total: roundedTotal.toFixed(2),
          });
        }
        return null;
      },
    },
  });

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (opened) {
      if (expense) {
        const refs = expense.attachmentReferences || [];
        const atts = (tripAttachments || []).filter((a) => refs.includes(a.id));
        setExistingAttachments(atts);
        form.setValues({
          name: expense.name,
          amount: expense.cost?.value || '',
          currency: expense.cost?.currency || defaultCurrency,
          occurredOn: expense.occurredOn || null,
          notes: expense.notes || '',
          category: expense.category || null,
          splitEnabled: !!(expense.splits && expense.splits.length > 0),
          splits: expense.splits || [],
        });
      } else {
        setExistingAttachments([]);
        form.reset();
      }
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, expense]);

  const categoryData = Object.keys(EXPENSE_CATEGORY_DATA).map((cat) => ({
    value: cat,
    label: t(EXPENSE_CATEGORY_DATA[cat].labelKey, EXPENSE_CATEGORY_DATA[cat].defaultLabel),
  }));

  const handleSubmit = async (values: ExpenseFormSchema) => {
    if (!values.name || !values.amount || !values.currency) return;
    setSaving(true);
    try {
      const uploadedAttachments = await uploadAttachments(trip.id, files);
      const newAttachmentIds = uploadedAttachments.map((a) => a.id);
      const existingAttachmentIds = existingAttachments.map((a) => a.id);
      const allAttachmentIds = [...existingAttachmentIds, ...newAttachmentIds];

      const payload: CreateExpense = {
        name: values.name.trim(),
        trip: trip.id,
        cost: { value: Number(values.amount), currency: values.currency },
        occurredOn: values.occurredOn ? fakeAsUtcString(values.occurredOn) : undefined,
        notes: values.notes.trim() || undefined,
        category: values.category || undefined,
        attachmentReferences: allAttachmentIds,
        splits: values.splitEnabled ? values.splits : undefined,
      };

      if (expense) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['listExpenses', trip.id] });
      await queryClient.invalidateQueries({ queryKey: ['getTripAttachments', trip.id] });
      onClose();
    } catch (err) {
      showErrorNotification({
        error: err,
        title: expense
          ? t('failed_to_update_expense', 'Failed to update expense')
          : t('failed_to_create_expense', 'Failed to create expense'),
        message: t('try_again_later', 'Please try again later.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const { mutate: removeExpense } = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listExpenses', trip.id] });
    },
  });

  const handleDelete = () => {
    if (!expense) return;
    openConfirmModal({
      title: t('delete_expense', 'Delete Expense'),
      confirmProps: { color: 'red' },
      children: (
        <span>
          {t('expense_deletion_confirmation', 'Deleting "{{name}}". This action cannot be undone.', {
            name: expense.name,
          })}
        </span>
      ),
      labels: { confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel') },
      onConfirm: () => {
        removeExpense(expense.id);
        showDeleteNotification({
          title: t('expenses', 'Expenses'),
          message: t('expense_deleted', 'Expense {{name}} has been deleted', { name: expense.name }),
        });
        onClose();
      },
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={expense ? t('edit_expense', 'Edit Expense') : t('add_expense', 'Add Expense')}
      size="lg"
      fullScreen={isMobile}
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Grid>
          <Grid.Col span={12}>
            <TextInput
              label={t('name', 'Name')}
              description={t('e_g_meals', 'e.g. Dinner at The French Laundry')}
              required
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              label={t('date', 'Date')}
              description={t('date_of_expense', 'Date for the expense record')}
              key={form.key('occurredOn')}
              {...form.getInputProps('occurredOn')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <CurrencyInput
              costKey={form.key('amount')}
              costProps={form.getInputProps('amount')}
              currencyCodeKey={form.key('currency')}
              currencyCodeProps={form.getInputProps('currency')}
              label={t('amount', 'Amount')}
              description="Value"
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Select
              label={t('category', 'Category')}
              description={t('select_category', 'Select a category')}
              data={categoryData}
              clearable
              key={form.key('category')}
              {...form.getInputProps('category')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label={t('notes', 'Notes')}
              description={t('optional', 'Optional')}
              key={form.key('notes')}
              {...form.getInputProps('notes')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <ExpenseSplitSection form={form} tripTravellers={tripTravellers} />
          </Grid.Col>
          <Grid.Col span={12}>
            <AttachmentsUploadField files={files} setFiles={setFiles} />
          </Grid.Col>
        </Grid>

        <Group justify="space-between" mt="md">
          {expense ? (
            <Button
              color="red"
              variant="outline"
              leftSection={<IconTrash size={16} />}
              onClick={handleDelete}
              type="button"
            >
              {t('delete', 'Delete')}
            </Button>
          ) : (
            <div />
          )}
          <Group>
            <Button variant="default" onClick={onClose} type="button">
              {t('cancel', 'Cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('save', 'Save')}
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  );
};
