import { Alert, Card, Stack, Text, Title } from '@mantine/core';
import { IconAlien } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { FlightInfoProviderSettings } from './FlightInfoProviderSettings.tsx';

export const ThirdPartyIntegrations = () => {
  const { t } = useTranslation();

  return (
    <Stack>
      <Card withBorder mt={'md'}>
        <Title order={3} fw={500}>
          {t('third_party_integrations', 'Integrations')}
        </Title>
        <Text fz="xs" c="dimmed" mt={3} mb="xl">
          {t('third_party_integrations_desc', 'Optional integrations with third party services')}
        </Text>

        <Alert title={t('data_privacy_notice', 'Data Privacy')} icon={<IconAlien />} variant="light" color="yellow">
          {t(
            'data_privacy_notice_details',
            'These integrations are offered as convenience. The service providers have not been vetted for their data privacy practices.'
          )}
        </Alert>
      </Card>
      <FlightInfoProviderSettings />
    </Stack>
  );
};
