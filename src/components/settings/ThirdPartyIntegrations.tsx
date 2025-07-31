import { Alert, Card, Group, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { FlightInfoProviderSettings } from './FlightInfoProviderSettings.tsx';
import { IconAlien } from '@tabler/icons-react';

export const ThirdPartyIntegrations = () => {
  const { t } = useTranslation();

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
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

      <div style={{ width: '100%', position: 'relative' }}>
        {/*<LoadingOverlay*/}
        {/*  visible={isPending}*/}
        {/*  zIndex={1000}*/}
        {/*  overlayProps={{ radius: 'sm', blur: 2 }}*/}
        {/*  loaderProps={{ type: 'bars' }}*/}
        {/*/>*/}

        <Group mt={'xl'}>{<FlightInfoProviderSettings />}</Group>
      </div>
    </Card>
  );
};
