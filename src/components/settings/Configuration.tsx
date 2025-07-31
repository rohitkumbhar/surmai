import { Card, Group, LoadingOverlay, Text, Title } from '@mantine/core';
import { getUsersMetadata } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { OAuth2SettingsForm } from './OAuth2SettingsForm.tsx';
import { useQuery } from '@tanstack/react-query';
import { NewUserSignups } from './NewUserSignups.tsx';

export const Configuration = () => {
  const {
    isPending,
    data: userModel,
    refetch,
  } = useQuery({
    queryKey: ['getUsersMetadata'],
    queryFn: () => getUsersMetadata(),
  });

  const { t } = useTranslation();

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        {t('configuration_section', 'Configuration')}
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        {t('configuration_section_description', 'Manage site wide configuration')}
      </Text>

      <div style={{ width: '100%', position: 'relative' }}>
        <LoadingOverlay
          visible={isPending}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ type: 'bars' }}
        />
        <NewUserSignups userModel={userModel} refetch={refetch} />
        <Group mt={'xl'}>{userModel && <OAuth2SettingsForm oauthConfig={userModel?.oauth2} refetch={refetch} />}</Group>
      </div>
    </Card>
  );
};
