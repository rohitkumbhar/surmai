import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  FileButton,
  Flex,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  RingProgress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createExpense,
  deleteExpense,
  getAttachmentUrl,
  getCurrencyConversionRates,
  listExpenses,
  updateExpense,
  uploadAttachments,
} from '../../../lib/api';
import i18n from '../../../lib/i18n.ts';
import { showDeleteNotification, showErrorNotification } from '../../../lib/notifications.tsx';
import type { ConversionRate } from '../../../types/expenses.ts';
import type { Attachment, CreateExpense, Expense, Trip } from '../../../types/trips.ts';
import { CurrencyInput } from '../../util/CurrencyInput.tsx';
import { convertExpenses, getExpenseTotalsByCurrency, getRandomColor } from './helper.ts';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

const EXPENSE_CATEGORY_DATA: { [key: string]: { label: string; color: string } } = {
  lodging: {
    label: i18n.t('expense_category_lodging', 'Lodging'),
    color: 'blue',
  },
  transportation: {
    label: i18n.t('expense_category_transportation', 'Transportation'),
    color: 'cyan',
  },
  food: {
    label: i18n.t('expense_category_food', 'Food'),
    color: 'teal',
  },
  entertainment: {
    label: i18n.t('expense_category_entertainment', 'Entertainment'),
    color: 'green',
  },
  shopping: {
    label: i18n.t('expense_category_shopping', 'Shopping'),
    color: 'lime',
  },
  activities: {
    label: i18n.t('expense_category_activities', 'Activities'),
    color: 'yellow',
  },
  healthcare: {
    label: i18n.t('expense_category_healthcare', 'Healthcare'),
    color: 'orange',
  },
  communication: {
    label: i18n.t('expense_category_communication', 'Communication'),
    color: 'red',
  },
  insurance: {
    label: i18n.t('expense_category_insurance', 'Insurance'),
    color: 'red',
  },
  visa_fees: {
    label: i18n.t('expense_category_visa_fees', 'Visa Fees'),
    color: 'pink',
  },
  souvenirs: {
    label: i18n.t('expense_category_souvenirs', 'Souvenirs'),
    color: 'grape',
  },
  tips: {
    label: i18n.t('expense_category_tips', 'Tips'),
    color: 'violet',
  },
  other: {
    label: i18n.t('expense_category_other', 'Other'),
    color: 'indigo',
  },
};

const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_DATA);

export const ExpensesPanel = ({ trip, tripAttachments }: { trip: Trip; tripAttachments?: Attachment[] }) => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState(trip.budget?.currency || user?.currencyCode || 'USD');
  const [occurredOn, setOccurredOn] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const isMobile = useMediaQuery('(max-width: 50em)');

  const { data: rawExpenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['listExpenses', trip.id],
    queryFn: () => listExpenses(trip.id),
  });

  const expenseCurrencies = rawExpenses?.map((e) => e.cost?.currency || 'USD');
  const currencyCodes = new Set([
    trip.budget?.currency || 'USD',
    user?.currencyCode || 'USD',
    ...(expenseCurrencies || []),
  ]);
  const { data: rates } = useQuery<ConversionRate[]>({
    queryKey: ['getCurrencyConversionRates', Array.from(currencyCodes)],
    queryFn: () => getCurrencyConversionRates(Array.from(currencyCodes)),
  });

  const expenses = convertExpenses(user, trip, rawExpenses || [], rates || []);
  const totalsByCurrency = getExpenseTotalsByCurrency(user, trip, expenses || []);

  const openModalForAdd = () => {
    resetForm();
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (expense: Expense) => {
    setName(expense.name);
    setAmount(expense.cost?.value || '');
    setCurrency(expense.cost?.currency || trip.budget?.currency || user?.currencyCode || 'USD');
    setOccurredOn(expense.occurredOn || null);
    setNotes(expense.notes || '');
    setCategory(expense.category || null);
    const refs = expense.attachmentReferences || [];
    const atts = (tripAttachments || []).filter((a) => refs.includes(a.id));
    setExistingAttachments(atts);
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCurrency(trip.budget?.currency || user?.currencyCode || 'USD');
    setOccurredOn(null);
    setNotes('');
    setCategory(null);
    setFiles([]);
    setExistingAttachments([]);
  };

  const onSave = async () => {
    if (!name || !amount || !currency) return;
    setSaving(true);
    try {
      // Upload new attachments first
      const uploadedAttachments = await uploadAttachments(trip.id, files);
      const newAttachmentIds = uploadedAttachments.map((a) => a.id);
      const existingAttachmentIds = existingAttachments.map((a) => a.id);
      const allAttachmentIds = [...existingAttachmentIds, ...newAttachmentIds];

      const payload: CreateExpense = {
        name: name.trim(),
        trip: trip.id,
        cost: { value: Number(amount), currency },
        occurredOn: occurredOn ? dayjs(occurredOn).format('YYYY-MM-DD') : undefined,
        notes: notes.trim() || undefined,
        category: category || undefined,
        attachmentReferences: allAttachmentIds,
      };

      if (selectedExpense) {
        // Edit mode
        await updateExpense(selectedExpense.id, payload);
      } else {
        // Add mode
        await createExpense(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['listExpenses', trip.id] });
      await queryClient.invalidateQueries({ queryKey: ['getTripAttachments', trip.id] });
      closeModal();
    } catch (err) {
      showErrorNotification({
        error: err,
        title: selectedExpense
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
    if (!selectedExpense) return;
    openConfirmModal({
      title: t('delete_expense', 'Delete Expense'),
      confirmProps: { color: 'red' },
      children: (
        <Text size="sm">
          {t('expense_deletion_confirmation', 'Deleting "{{name}}". This action cannot be undone.', {
            name: selectedExpense.name,
          })}
        </Text>
      ),
      labels: { confirm: t('delete', 'Delete'), cancel: t('cancel', 'Cancel') },
      onConfirm: () => {
        removeExpense(selectedExpense.id);
        showDeleteNotification({
          title: t('expenses', 'Expenses'),
          message: t('expense_deleted', 'Expense {{name}} has been deleted', { name: selectedExpense.name }),
        });
        closeModal();
      },
    });
  };

  const openAttachmentViewer = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment, attachment.file);
    openContextModal({
      modal: 'attachmentViewer',
      title: attachment.name,
      radius: 'md',
      withCloseButton: true,
      fullScreen: isMobile,
      size: 'auto',
      innerProps: {
        fileName: attachment.name,
        attachmentUrl: url,
      },
    });
  };

  const sortedExpenses = [...(expenses || [])].sort((a, b) => {
    if (!sortBy) return 0;

    let comparison = 0;
    if (sortBy === 'date') {
      const dateA = a.occurredOn ? new Date(a.occurredOn).getTime() : 0;
      const dateB = b.occurredOn ? new Date(b.occurredOn).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'category') {
      const catA = a.category || '';
      const catB = b.category || '';
      comparison = catA.localeCompare(catB);
    } else if (sortBy === 'amount') {
      const amountA = a.convertedCost?.value || 0;
      const amountB = b.convertedCost?.value || 0;
      comparison = amountA - amountB;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  let expenseAttachmentsMap: { [key: string]: Attachment[] } = {};
  (expenses || []).forEach((e: Expense) => {
    const expenseAttachments = tripAttachments?.filter(
      (a) => e.attachmentReferences && e.attachmentReferences.includes(a.id)
    );
    expenseAttachmentsMap = { ...expenseAttachmentsMap, [e.id]: expenseAttachments || [] };
  });

  // Calculate statistics
  const totalExpenses = sortedExpenses.reduce((sum, exp) => {
    return sum + (exp.convertedCost?.value || 0);
  }, 0);

  const budgetAmount = trip.budget?.value || 0;
  const budgetCurrency = trip.budget?.currency || 'USD';
  const budgetPercentage = budgetAmount > 0 ? Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;

  // Group expenses by category
  const categoryTotals = sortedExpenses.reduce(
    (acc, exp) => {
      const cat = exp.category || 'other';
      acc[cat] = (acc[cat] || 0) + (exp.convertedCost?.value || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

  const expenseCards = sortedExpenses.map((exp) => (
    <Grid.Col key={exp.id} span={{ base: 12, sm: 6, md: 4 }}>
      <Card withBorder padding="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              <Text fw={500} size="lg" lineClamp={1}>
                {exp.name}
              </Text>
              {/*{exp.notes && (
                <Text size="sm" c="dimmed">
                  {exp.notes}
                </Text>
              )}*/}
            </Stack>
            <ActionIcon
              variant="default"
              aria-label={t('edit_expense', 'Edit Expense')}
              onClick={() => openModalForEdit(exp)}
              title={t('edit_expense', 'Edit Expense')}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Group>

          <Flex direction="column" gap="xs" mt="xs">
            {exp.occurredOn && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {t('date', 'Date')}:
                </Text>
                <Text size="sm" c="dimmed">
                  {dayjs(exp.occurredOn).format('ll')}
                </Text>
              </Group>
            )}

            <Group gap="xs">
              <Text size="sm" fw={500}>
                {t('category', 'Category')}:
              </Text>
              <Badge variant="light" size="sm">
                {EXPENSE_CATEGORY_DATA[exp.category || 'other'].label}
              </Badge>
            </Group>

            {exp.convertedCost && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {t('amount', 'Amount')}:
                </Text>
                <Text size="sm" fw={600} c="blue">
                  {exp.convertedCost.value} {exp.convertedCost.currency}
                </Text>
              </Group>
            )}
            {exp.id in expenseAttachmentsMap && (
              <Group>
                {expenseAttachmentsMap[exp.id].map((attachment) => {
                  return (
                    <Anchor
                      size="sm"
                      onClick={() => {
                        openAttachmentViewer(attachment);
                      }}
                    >
                      {attachment.name}
                    </Anchor>
                  );
                })}
              </Group>
            )}
          </Flex>
        </Stack>
      </Card>
    </Grid.Col>
  ));

  return (
    <Paper bg={'var(--mantine-color-body)'} mt={'sm'}>
      <Group justify="space-between" align="center" mb="md">
        <Select
          label={t('sort_by', 'Sort by')}
          placeholder={t('select_sort', 'Select sorting')}
          value={sortBy ? `${sortBy}-${sortDirection}` : null}
          onChange={(value) => {
            if (value) {
              const [column, direction] = value.split('-') as ['date' | 'category' | 'amount', 'asc' | 'desc'];
              setSortBy(column);
              setSortDirection(direction);
            } else {
              setSortBy(null);
              setSortDirection('asc');
            }
          }}
          data={[
            { value: 'date-asc', label: `${t('date', 'Date')} (${t('ascending', 'Ascending')})` },
            { value: 'date-desc', label: `${t('date', 'Date')} (${t('descending', 'Descending')})` },
            { value: 'category-asc', label: `${t('category', 'Category')} (${t('ascending', 'Ascending')})` },
            { value: 'category-desc', label: `${t('category', 'Category')} (${t('descending', 'Descending')})` },
            { value: 'amount-asc', label: `${t('amount', 'Amount')} (${t('ascending', 'Ascending')})` },
            { value: 'amount-desc', label: `${t('amount', 'Amount')} (${t('descending', 'Descending')})` },
          ]}
          clearable
          style={{ maxWidth: 300 }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={openModalForAdd}>
          {t('add_expense', 'Add Expense')}
        </Button>
      </Group>

      {/* Stat Cards */}
      {!isLoading && sortedExpenses.length > 0 && (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="md">
          {/* Budget Usage Card */}
          <Card withBorder padding="md" radius="md">
            <Stack gap="md">
              <Text size="lg" fw={600}>
                {t('budget_overview', 'Budget Overview')}
              </Text>

              {budgetAmount > 0 ? (
                <>
                  <Group justify="space-evenly" mt="xs">
                    <RingProgress
                      size={200}
                      thickness={32}
                      sections={[
                        {
                          value: budgetPercentage,
                          color: budgetPercentage > 90 ? 'red' : budgetPercentage > 75 ? 'orange' : 'blue',
                        },
                      ]}
                      label={
                        <Text size="xl" fw={700} ta="center">
                          {budgetPercentage.toFixed(0)}%
                        </Text>
                      }
                    />
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          {t('used', 'Used')}:
                        </Text>
                        <Text size="sm" fw={600}>
                          {totalExpenses.toFixed(2)} {budgetCurrency}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          {t('budget', 'Budget')}:
                        </Text>
                        <Text size="sm" fw={600}>
                          {budgetAmount.toFixed(2)} {budgetCurrency}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          {t('remaining', 'Remaining')}:
                        </Text>
                        <Text size="sm" fw={600} c={budgetAmount - totalExpenses < 0 ? 'red' : 'green'}>
                          {(budgetAmount - totalExpenses).toFixed(2)} {budgetCurrency}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  {t('no_budget_set', 'No budget set for this trip')}
                </Text>
              )}
            </Stack>
            <Card.Section px="md" mt={'xl'}>
              <Anchor size="sm" href="https://www.exchangerate-api.com" ta="end">
                Rates By Exchange Rate API
              </Anchor>
            </Card.Section>
          </Card>

          {/* Expenses by Category Card */}
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              <Text size="lg" fw={600}>
                {t('expenses_by_category', 'Expenses by Category')}
              </Text>

              {sortedCategories.length > 0 ? (
                <>
                  {/* Pie Chart */}
                  <Group justify="center" mt="xs">
                    <RingProgress
                      size={200}
                      thickness={32}
                      sections={sortedCategories.map(([category, amount], _index) => {
                        const percentage = (amount / totalExpenses) * 100;
                        const color = EXPENSE_CATEGORY_DATA[category]?.color || 'red';
                        return {
                          value: percentage,
                          color: color,
                          tooltip: `${EXPENSE_CATEGORY_DATA[category].label}: ${amount.toFixed(2)} ${budgetCurrency}`,
                        };
                      })}
                      label={
                        <Stack gap={0} align="center">
                          <Text size="xs" c="dimmed" ta="center">
                            {t('total', 'Total')}
                          </Text>
                          <Text size="lg" fw={700} ta="center">
                            {totalExpenses.toFixed(0)}
                          </Text>
                          <Text size="xs" c="dimmed" ta="center">
                            {budgetCurrency}
                          </Text>
                        </Stack>
                      }
                    />

                    <Stack gap="xs" mt="sm">
                      {sortedCategories.map(([category, amount], _index) => {
                        const color = EXPENSE_CATEGORY_DATA[category]?.color || 'red';
                        const percentage = (amount / totalExpenses) * 100;
                        return (
                          <Group key={category} justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 2,
                                  backgroundColor: `var(--mantine-color-${color}-6)`,
                                  flexShrink: 0,
                                }}
                              />
                              <Text size="sm" fw={500}>
                                {EXPENSE_CATEGORY_DATA[category].label}
                              </Text>
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                              <Text size="sm" c="dimmed">
                                {percentage.toFixed(1)}%
                              </Text>
                              <Text size="sm" fw={600}>
                                {amount.toFixed(2)} {budgetCurrency}
                              </Text>
                            </Group>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Group>

                  {/* Legend */}
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  {t('no_expenses', 'No expenses yet')}
                </Text>
              )}
            </Stack>
          </Card>

          {/* Expenses by Currency */}
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              <Text size="lg" fw={600}>
                {t('expenses_by_curency', 'Expenses by Currency')}
              </Text>

              {Object.keys(totalsByCurrency).length > 0 ? (
                <>
                  {/* Pie Chart */}
                  <Group justify="center" mt="xs">
                    <RingProgress
                      size={200}
                      thickness={32}
                      sections={Object.entries(totalsByCurrency).map(([currencyCode, amount], _index) => {
                        const percentage = (amount.convertedTotal / totalExpenses) * 100;
                        const color = getRandomColor(currencyCode) || 'red';
                        return {
                          value: percentage,
                          color: color,
                          tooltip: `${amount.total.toFixed(2)} ${currencyCode}`,
                        };
                      })}
                      label={
                        <Stack gap={0} align="center">
                          <Text size="lg" fw={700} ta="center">
                            {Object.keys(totalsByCurrency).length}
                          </Text>
                          <Text size="xs" c="dimmed" ta="center">
                            {t('currencies', 'Currencies')}
                          </Text>
                        </Stack>
                      }
                    />

                    <Stack gap="xs" mt="sm">
                      {Object.entries(totalsByCurrency).map(([currencyCode, amount], _index) => {
                        const color = getRandomColor(currencyCode) || 'red';
                        const percentage = (amount.convertedTotal / totalExpenses) * 100;
                        return (
                          <Group key={currencyCode} justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 2,
                                  backgroundColor: `var(--mantine-color-${color}-6)`,
                                  flexShrink: 0,
                                }}
                              />
                              <Text size="sm" fw={500}>
                                {`${currencyCode} ${amount.total.toFixed(2)} `}
                              </Text>
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                              <Text size="sm" c="dimmed">
                                {percentage.toFixed(1)}%
                              </Text>
                            </Group>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Group>

                  {/* Legend */}
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  {t('no_expenses', 'No expenses yet')}
                </Text>
              )}
            </Stack>
          </Card>
        </SimpleGrid>
      )}

      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader size="lg" />
        </Group>
      ) : sortedExpenses.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            {t('no_expenses', 'No expenses yet')}
          </Text>
        </Card>
      ) : (
        <Grid gutter="sm">{expenseCards}</Grid>
      )}

      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        title={selectedExpense ? t('edit_expense', 'Edit Expense') : t('add_expense', 'Add Expense')}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label={t('name', 'Name')}
            description={t('e_g_meals', 'e.g. Dinner at The French Laundry')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />
          <Select
            label={t('category', 'Category')}
            description={t('select_category', 'Select a category')}
            value={category}
            onChange={setCategory}
            data={EXPENSE_CATEGORIES.map((cat) => ({
              value: cat,
              label: EXPENSE_CATEGORY_DATA[cat].label,
            }))}
            clearable
          />
          <Group>
            <CurrencyInput
              costKey="expense-amount"
              costProps={{
                value: amount,
                onChange: (v: number | string) => {
                  if (typeof v === 'number') {
                    setAmount(v);
                  }
                },
                required: true,
              }}
              currencyCodeKey="expense-currency"
              currencyCodeProps={{
                value: currency,
                onChange: (v: string | null) => setCurrency(v || user?.currencyCode || 'USD'),
                required: true,
              }}
              label={t('amount', 'Amount')}
              description="Value"
            />
            <DateInput
              label={t('date', 'Date')}
              value={occurredOn}
              description={t('date_of_expense', 'Date for the expense record')}
              onChange={setOccurredOn}
            />
          </Group>
          <TextInput
            label={t('notes', 'Notes')}
            description={t('optional', 'Optional')}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />

          <Stack gap="xs">
            <Title size="md">{t('attachments', 'Attachments')}</Title>
            <Text size="xs" c="dimmed">
              {t('expense_attachments_desc', 'Upload receipts, invoices or other related documents')}
            </Text>

            {files.length > 0 && (
              <Stack gap="xs">
                {files.map((file, index) => (
                  <Text key={index} size="sm">
                    {file.name}
                  </Text>
                ))}
              </Stack>
            )}

            <Group>
              <FileButton
                onChange={setFiles}
                accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/html"
                multiple
              >
                {(props) => {
                  if (selectedExpense) {
                    return (
                      <Stack gap={4}>
                        {existingAttachments.length > 0 && (
                          <Text size="xs" c="dimmed">
                            {t('existing_files_count', '{{count}} existing file(s)', {
                              count: existingAttachments.length,
                            })}
                          </Text>
                        )}
                        <Button {...props} variant="default" size="sm">
                          {t('upload_more', 'Upload More')}
                        </Button>
                      </Stack>
                    );
                  } else {
                    return (
                      <Button {...props} variant="primary" size="sm">
                        {t('upload', 'Upload')}
                      </Button>
                    );
                  }
                }}
              </FileButton>
            </Group>
          </Stack>

          <Group justify="space-between" mt="md">
            {selectedExpense ? (
              <Button color="red" variant="outline" leftSection={<IconTrash size={16} />} onClick={handleDelete}>
                {t('delete', 'Delete')}
              </Button>
            ) : (
              <div />
            )}
            <Group>
              <Button variant="default" onClick={closeModal}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={onSave} loading={saving} disabled={!name || !amount || !currency}>
                {t('save', 'Save')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
};
