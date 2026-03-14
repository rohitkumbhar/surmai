import { Grid, NumberInput, Switch, Text } from '@mantine/core';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import type { ExpenseFormSchema, ExpenseSplit, TravellerProfile } from '../../../types/trips.ts';
import type { UseFormReturnType } from '@mantine/form';

export const ExpenseSplitSection = ({
  form,
  tripTravellers,
}: {
  form: UseFormReturnType<ExpenseFormSchema>;
  tripTravellers: TravellerProfile[];
}) => {
  const { t } = useTranslation();

  const splitEnabled = form.getValues().splitEnabled;
  const splits = form.getValues().splits;
  const currency = form.getValues().currency;

  const initializeSplits = () => {
    const amount = form.getValues().amount;
    const total = typeof amount === 'number' ? amount : 0;
    const perPerson = tripTravellers.length > 0 ? Math.round((total / tripTravellers.length) * 100) / 100 : 0;
    const newSplits = tripTravellers.map((tp, index) => ({
      travellerId: tp.id,
      amount: index === 0 ? Math.round((total - perPerson * (tripTravellers.length - 1)) * 100) / 100 : perPerson,
    }));
    form.setFieldValue('splits', newSplits);
  };

  const updateSplitAmount = (travellerId: string, value: number) => {
    const updated = splits.map((s: ExpenseSplit) => (s.travellerId === travellerId ? { ...s, amount: value } : s));
    form.setFieldValue('splits', updated);
  };

  if (tripTravellers.length === 0) return null;

  return (
    <>
      <Switch
        label={t('split_expense', 'Split expense')}
        checked={splitEnabled}
        onChange={(e) => {
          const checked = e.currentTarget.checked;
          form.setFieldValue('splitEnabled', checked);
          if (checked) {
            initializeSplits();
          } else {
            form.setFieldValue('splits', []);
          }
        }}
      />

      {splitEnabled && (
        <Grid mt={'sm'}>
          {splits.map((split: ExpenseSplit) => {
            const profile = tripTravellers.find((tp) => tp.id === split.travellerId);
            return (
              <Fragment key={split.travellerId}>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" style={{ minWidth: 120 }}>
                    {profile?.legalName || split.travellerId}
                  </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    value={split.amount}
                    onChange={(val) => updateSplitAmount(split.travellerId, typeof val === 'number' ? val : 0)}
                    min={0}
                    decimalScale={2}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                </Grid.Col>
              </Fragment>
            );
          })}
          <Text size="xs" c="dimmed">
            {t('split_total', 'Split total')}:{' '}
            {splits.reduce((sum: number, s: ExpenseSplit) => sum + s.amount, 0).toFixed(2)} {currency}
          </Text>
          {form.errors.splits && (
            <Text size="xs" c="red">
              {form.errors.splits}
            </Text>
          )}
        </Grid>
      )}
    </>
  );
};
