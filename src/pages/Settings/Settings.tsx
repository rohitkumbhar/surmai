import { Container, Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { Header } from '../../components/nav/Header.tsx';
import { UsersSettings } from '../../components/settings/UsersSettings.tsx';
import { Datasets } from '../../components/settings/Datasets.tsx';
import { SmtpSettingsForm } from '../../components/settings/SmtpSettingsForm.tsx';
import { useEffect } from 'react';
import { adminAuthRefresh, logoutCurrentUser } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { IconMail, IconSettings, IconUsers } from '@tabler/icons-react';

export const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(t('site_settings', 'Site Settings'));

  useEffect(() => {
    adminAuthRefresh().catch(() => {
      console.error('Could not refresh admin credentials. Logging out');
      logoutCurrentUser().then(() => {
        navigate(0);
      });
    });
  }, [navigate]);

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('site_settings', 'Site Settings')}
        </Text>
      </Header>

      <Tabs defaultValue="users">
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUsers size={12} />}>
            {t('users_section', 'Users')}
          </Tabs.Tab>
          <Tabs.Tab value="smtp" leftSection={<IconMail size={12} />}>
            {t('smtp_settings', 'SMTP Settings')}
          </Tabs.Tab>
          <Tabs.Tab value="datasets" leftSection={<IconSettings size={12} />}>
            {t('dataset_section_title', 'Datasets')}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="users">
          <UsersSettings />
        </Tabs.Panel>
        <Tabs.Panel value="smtp">
          <SmtpSettingsForm />
        </Tabs.Panel>
        <Tabs.Panel value="datasets">
          <Datasets />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
