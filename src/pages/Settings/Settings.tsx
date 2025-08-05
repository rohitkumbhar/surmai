import { Container, Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/nav/Header.tsx';
import { Configuration } from '../../components/settings/Configuration.tsx';
import { Datasets } from '../../components/settings/Datasets.tsx';
import { SmtpSettingsForm } from '../../components/settings/SmtpSettingsForm.tsx';
import { useEffect } from 'react';
import { adminAuthRefresh, logoutCurrentUser } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { IconAdjustmentsPlus, IconKey, IconMail, IconSettings, IconUsers } from '@tabler/icons-react';
import { UserList } from '../../components/settings/UserList.tsx';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';
import { ThirdPartyIntegrations } from '../../components/settings/ThirdPartyIntegrations.tsx';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageTitle(t('site_settings', 'Site Settings'));

  useEffect(() => {
    adminAuthRefresh().catch(() => {
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

      <Tabs defaultValue="users" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUsers size={12} />}>
            {t('users_section', 'Users')}
          </Tabs.Tab>
          <Tabs.Tab value="smtp" leftSection={<IconMail size={12} />}>
            {t('smtp_settings', 'SMTP Settings')}
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconKey size={12} />}>
            {t('site_configuration', 'Configuration')}
          </Tabs.Tab>
          <Tabs.Tab value="datasets" leftSection={<IconSettings size={12} />}>
            {t('dataset_section', 'Datasets')}
          </Tabs.Tab>
          <Tabs.Tab value="integrations" leftSection={<IconAdjustmentsPlus size={12} />}>
            {t('integrations_section', 'Integrations')}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="users">
          <UserList />
        </Tabs.Panel>
        <Tabs.Panel value="security">
          <Configuration />
        </Tabs.Panel>
        <Tabs.Panel value="smtp">
          <SmtpSettingsForm />
        </Tabs.Panel>
        <Tabs.Panel value="datasets">
          <Datasets />
        </Tabs.Panel>
        <Tabs.Panel value="integrations">
          <ThirdPartyIntegrations />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default Settings;