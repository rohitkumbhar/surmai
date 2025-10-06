import { NumberInput, rem, Select } from '@mantine/core';

import { currencyCodes } from './currencyCodes.ts';

export const CurrencyInput = ({
  currencyCodeKey,
  costKey,
  costProps,
  currencyCodeProps,
  label,
  description,
  maxWidth = 280,
}: {
  currencyCodeKey: string;
  costKey: string;
  costProps: any;
  currencyCodeProps: any;
  label: string;
  description: string;
  maxWidth?: number;
}) => {
  const select = (
    <Select
      key={currencyCodeKey}
      {...currencyCodeProps}
      data={currencyCodes}
      searchable
      rightSectionWidth={28}
      withCheckIcon={false}
      styles={{
        input: {
          fontWeight: 500,
          // borderTop: 'none',
          // borderBottom: 'none',
          marginBottom: '5px',

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
      label={label}
      description={description}
      rightSection={select}
      rightSectionWidth={92}
      key={costKey}
      allowNegative={false}
      allowDecimal={true}
      allowLeadingZeros={false}
      decimalScale={2}
      maw={rem(maxWidth)}
      {...costProps}
    />
  );
};
