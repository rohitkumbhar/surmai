import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface Item {
  value: string;
  label: string;
  description: string;
}

const colors: Item[] = [
  {
    value: 'blueGray',
    label: '🐋 Whale',
    description: 'From the depths of the ocean',
  },
  {
    value: 'pnw',
    label: '🌲 Pacific Northwest',
    description: 'Evergreen all the time',
  },
  {
    value: 'sahara',
    label: '☀️ Sahara Desert',
    description: 'Sun and sand but no Mojitos',
  },

  {
    value: 'shrimp',
    label: '🦐 Shrimp-ity Shrimp',
    description: 'Shrimp Indeed',
  },
  { value: 'caribbean', label: '🏝️ Caribbean', description: 'Island Time' },
  { value: 'potato', label: '🥔 Potato', description: 'Anyway you like it' },
];

export function ColorSchemeSelect({ formKey, formProps }: { formKey: string; formProps: any }) {
  const { t } = useTranslation();

  return (
    <Select
      mt={'sm'}
      key={formKey}
      {...formProps}
      data={colors}
      label={'Select Primary Color'}
      description={t('color_scheme_description', 'Set the primary color based on your taste')}
      withCheckIcon={false}
      // renderOption={renderSelectOption}
    />
  );
}
