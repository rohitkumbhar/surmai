import { Container, Paper, SimpleGrid, Tabs, Text, Title } from '@mantine/core';
import { IconBell, IconEPassport, IconInfoCircle, IconKey } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { ChangePasswordForm } from '../../components/account/ChangePasswordForm.tsx';
import { UserAvatarForm } from '../../components/account/UserAvatarForm.tsx';
import { UserSettingsForm } from '../../components/account/UserSettingsForm.tsx';
import { Header } from '../../components/nav/Header.tsx';
import { UserNotifications } from '../../components/notifications/UserNotifications.tsx';
import { MyTravelProfile } from '../../components/traveller/MyTravelProfile.tsx';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';

export const UserProfile = () => {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const validTabs = ['basic_info', 'security', 'travel_info', 'notifications'];
  const fragment = hash.slice(1);
  const activeTab = validTabs.includes(fragment) ? fragment : validTabs[0];
  usePageTitle(t('settings', 'Settings'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('user_profile', 'User Profile')}
        </Text>
      </Header>
      <Tabs value={activeTab} onChange={(tab) => navigate({ hash: tab || 'basic_info' }, { replace: true })}>
        <Tabs.List>
          <Tabs.Tab value="basic_info" leftSection={<IconInfoCircle size={12} />}>
            {t('user_preferences', 'Preferences')}
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconKey size={12} />}>
            {t('user_security_info', 'Security')}
          </Tabs.Tab>
          <Tabs.Tab value="travel_info" leftSection={<IconEPassport size={12} />}>
            {t('travel_info', 'Travel Info')}
          </Tabs.Tab>
          <Tabs.Tab value="notifications" leftSection={<IconBell size={12} />}>
            {t('notifications', 'Notifications')}
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
        <Tabs.Panel value="travel_info">
          <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'} mt={'md'}>
            <Title order={4} mb="md">
              {t('my_travel_info', 'My Travel Info')}
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              {t(
                'my_travel_info_desc',
                'Store your travel documents and ID numbers for easy access when booking trips.'
              )}
            </Text>
            <MyTravelProfile />
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="notifications">
          <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'} mt={'md'}>
            <Title order={4} mb="md">
              {t('Notifications', 'Notifications')}
            </Title>
            <UserNotifications />
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
