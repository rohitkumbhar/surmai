import { Button, Card, Grid, Group, Loader, Select, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ExpenseCard } from './ExpenseCard.tsx';
import { ExpenseFormModal } from './ExpenseFormModal.tsx';
import { ExpenseStatCards } from './ExpenseStatCards.tsx';
import { useTripExpenses } from './useTripExpenses.ts';
import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';

import type { Attachment, Expense, TravellerProfile, Trip } from '../../../types/trips.ts';

export const ExpensesPanel = ({
  trip,
  tripAttachments,
  tripTravellers = [],
}: {
  trip: Trip;
  tripAttachments?: Attachment[];
  tripTravellers?: TravellerProfile[];
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { isMobile } = useSurmaiContext();

  const EXPENSE_CATEGORY_DATA: Record<string, { label: string; color: string }> = {
    lodging: { label: t('expense_category_lodging', 'Lodging'), color: 'blue' },
    transportation: { label: t('expense_category_transportation', 'Transportation'), color: 'cyan' },
    food: { label: t('expense_category_food', 'Food'), color: 'teal' },
    entertainment: { label: t('expense_category_entertainment', 'Entertainment'), color: 'green' },
    shopping: { label: t('expense_category_shopping', 'Shopping'), color: 'lime' },
    activities: { label: t('expense_category_activities', 'Activities'), color: 'yellow' },
    healthcare: { label: t('expense_category_healthcare', 'Healthcare'), color: 'orange' },
    communication: { label: t('expense_category_communication', 'Communication'), color: 'red' },
    insurance: { label: t('expense_category_insurance', 'Insurance'), color: 'red' },
    visa_fees: { label: t('expense_category_visa_fees', 'Visa Fees'), color: 'pink' },
    souvenirs: { label: t('expense_category_souvenirs', 'Souvenirs'), color: 'grape' },
    tips: { label: t('expense_category_tips', 'Tips'), color: 'violet' },
    other: { label: t('expense_category_other', 'Other'), color: 'indigo' },
  };

  const { convertedExpenses, totalsByCurrency, isLoading } = useTripExpenses({ trip });

  const openModalForAdd = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
  };

  const sortedExpenses = [...(convertedExpenses || [])].sort((a, b) => {
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

  const expenseAttachmentsMap: Record<string, Attachment[]> = {};
  (convertedExpenses || []).forEach((e: Expense) => {
    expenseAttachmentsMap[e.id] = (tripAttachments || []).filter(
      (a) => e.attachmentReferences && e.attachmentReferences.includes(a.id)
    );
  });

  return (
    <>
      <Group justify="space-between" align="center" mt="md" mb="md" p={0}>
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
        {trip.canUpdate && (
          <Button leftSection={<IconPlus size={16} />} onClick={openModalForAdd}>
            {t('add_expense', 'Add Expense')}
          </Button>
        )}
      </Group>

      {!isLoading && sortedExpenses.length > 0 && (
        <ExpenseStatCards
          trip={trip}
          expenses={sortedExpenses}
          totalsByCurrency={totalsByCurrency}
          categoryData={EXPENSE_CATEGORY_DATA}
        />
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
        <Grid gap="sm">
          {sortedExpenses.map((exp) => (
            <Grid.Col key={exp.id} span={{ base: 12, sm: 6, md: 4 }}>
              <ExpenseCard
                expense={exp}
                attachments={expenseAttachmentsMap[exp.id] || []}
                categoryData={EXPENSE_CATEGORY_DATA}
                onEdit={() => openModalForEdit(exp)}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <ExpenseFormModal
        opened={isModalOpen}
        onClose={closeModal}
        trip={trip}
        expense={selectedExpense}
        tripAttachments={tripAttachments}
        tripTravellers={tripTravellers}
        isMobile={isMobile}
      />
    </>
  );
};
