import { Anchor, Card, Group, RingProgress, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { getRandomColor } from './helper.ts';

import type { ConvertedExpense, Trip } from '../../../types/trips.ts';

type CurrencyTotal = {
  total: number;
  convertedTotal: number;
};

export const ExpenseStatCards = ({
  trip,
  expenses,
  totalsByCurrency,
  categoryData,
}: {
  trip: Trip;
  expenses: ConvertedExpense[];
  totalsByCurrency: Record<string, CurrencyTotal>;
  categoryData: Record<string, { label: string; color: string }>;
}) => {
  const { t } = useTranslation();

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.convertedCost?.value || 0), 0);
  const budgetAmount = trip.budget?.value || 0;
  const budgetCurrency = trip.budget?.currency || 'USD';
  const budgetPercentage = budgetAmount > 0 ? Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;

  const categoryTotals = expenses.reduce(
    (acc, exp) => {
      const cat = exp.category || 'other';
      acc[cat] = (acc[cat] || 0) + (exp.convertedCost?.value || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

  return (
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
              {t('no_budget_set', 'No budget set')}
            </Text>
          )}
        </Stack>
        <Card.Section px="md" mt={'xl'}>
          <Anchor size="sm" href="https://www.exchangerate-api.com" ta="end" target="_blank">
            conversionRates By Exchange Rate API
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
            <Group justify="center" mt="xs">
              <RingProgress
                size={200}
                thickness={32}
                sections={sortedCategories.map(([category, amount]) => {
                  const percentage = (amount / totalExpenses) * 100;
                  const color = categoryData[category]?.color || 'red';
                  return {
                    value: percentage,
                    color: color,
                    tooltip: `${categoryData[category]?.label}: ${amount.toFixed(2)} ${budgetCurrency}`,
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
                {sortedCategories.map(([category, amount]) => {
                  const color = categoryData[category]?.color || 'red';
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
                          {categoryData[category]?.label}
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
            <Group justify="center" mt="xs">
              <RingProgress
                size={200}
                thickness={32}
                sections={Object.entries(totalsByCurrency).map(([currencyCode, amount]) => {
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
                {Object.entries(totalsByCurrency).map(([currencyCode, amount]) => {
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
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {t('no_expenses', 'No expenses yet')}
            </Text>
          )}
        </Stack>
      </Card>
    </SimpleGrid>
  );
};
