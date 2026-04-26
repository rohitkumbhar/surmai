import { Alert, Card, Stack, Text, Title } from '@mantine/core';
import { IconAi } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { ImportBookingsConfiguration } from './ImportBookingsConfiguration.tsx';
import { OpenAIEndpointConfiguration } from './OpenAIEndpointConfiguration.tsx';

export const AssistantConfiguration = () => {
  const { t } = useTranslation();

  return (
    <Stack>
      <Card withBorder mt={'md'}>
        <Title order={3} fw={500}>
          {t('surmai_assistant', 'Surmai Assistant')}
        </Title>
        <Text fz="xs" c="dimmed" mt={3} mb="xl">
          {t('surmai_assistant_desc', 'Configure Surmai Assistant capabilities')}
        </Text>

        <Alert
          title={t('ai_usage_data_privacy_notice', 'AI Usage & Data Privacy')}
          icon={<IconAi />}
          variant="light"
          color="yellow"
        >
          {t(
            'ai_usage_notice_details',
            'This feature uses a large language model to extract information from email. All email content is sent to a LLM configured here.'
          )}
        </Alert>
      </Card>
      <OpenAIEndpointConfiguration />
      <ImportBookingsConfiguration />
    </Stack>
  );
};
