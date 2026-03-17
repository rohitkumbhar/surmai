import { MultiSelect } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { TravellerProfile } from '../../types/trips.ts';

export const TravellerMultiSelect = ({
  tripTravellers,
  value,
  onChange,
  formKey,
}: {
  tripTravellers: TravellerProfile[];
  value?: string[];
  onChange: (value: string[]) => void;
  formKey?: string;
}) => {
  const { t } = useTranslation();

  if (tripTravellers.length === 0) return null;

  const travellerOptions = tripTravellers.map((p) => ({
    value: p.id,
    label: `${p.legalName} (${p.email})`,
  }));

  return (
    <MultiSelect
      label={t('travellers', 'Travellers')}
      description={t('assign_travellers_description', 'Optionally assign traveller profiles')}
      data={travellerOptions}
      searchable
      clearable
      value={value || []}
      onChange={onChange}
      key={formKey}
    />
  );
};
