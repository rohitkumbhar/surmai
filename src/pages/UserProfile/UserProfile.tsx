import { Container, Paper, SimpleGrid, Tabs, Text, Title } from '@mantine/core';
import { IconInfoCircle, IconKey } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { ChangePasswordForm } from '../../components/account/ChangePasswordForm.tsx';
import { UserAvatarForm } from '../../components/account/UserAvatarForm.tsx';
import { UserSettingsForm } from '../../components/account/UserSettingsForm.tsx';
import { Header } from '../../components/nav/Header.tsx';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';

export const UserProfile = () => {
  const { t } = useTranslation();
  usePageTitle(t('settings', 'Settings'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('user_profile', 'User Profile')}
        </Text>
      </Header>
      <Tabs defaultValue="basic_info">
        <Tabs.List>
          <Tabs.Tab value="basic_info" leftSection={<IconInfoCircle size={12} />}>
            {t('user_basic_info', 'Basic Information')}
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconKey size={12} />}>
            {t('user_security_info', 'Security')}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="basic_info">
          <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'} mt={'md'}>
            <Title order={4}>{t('user_basic_info_desc', 'Update your basic information and preferences')}</Title>
            <SimpleGrid cols={2}>
              <UserSettingsForm />
              <UserAvatarForm />
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="security">
          <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'} mt={'md'}>
            <Title order={4}>{t('user_security_info_desc', 'Update your security preferences')}</Title>
            <ChangePasswordForm />
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
