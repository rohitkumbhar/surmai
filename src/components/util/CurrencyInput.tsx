import { NumberInput, rem, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { currencyCodes } from './currencyCodes.ts';

export const CurrencyInput = ({
  currencyCodeKey,
  costKey,
  costProps,
  currencyCodeProps,
}: {
  currencyCodeKey: string;
  costKey: string;
  costProps: any;
  currencyCodeProps: any;
}) => {
  const { t } = useTranslation();

  const select = (
    <Select
      key={currencyCodeKey}
      {...currencyCodeProps}
      data={currencyCodes}
      rightSectionWidth={28}
      withCheckIcon={false}
      styles={{
        input: {
          fontWeight: 500,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          width: rem(92),
          marginRight: rem(-2),
        },
      }}
    />
  );

  return (
    <NumberInput
      type="number"
      placeholder=""
      label={t('cost', 'Cost')}
      rightSection={select}
      rightSectionWidth={92}
      key={costKey}
      allowNegative={false}
      allowDecimal={true}
      allowLeadingZeros={false}
      decimalScale={2}
      {...costProps}
    />
  );
};
