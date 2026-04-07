import { Container, Tabs, Text } from '@mantine/core';
import { IconAdjustmentsPlus, IconKey, IconSettings, IconUsers } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Header } from '../../components/nav/Header.tsx';
import { Configuration } from '../../components/settings/Configuration.tsx';
import { Datasets } from '../../components/settings/Datasets.tsx';
import { ThirdPartyIntegrations } from '../../components/settings/ThirdPartyIntegrations.tsx';
import { UserList } from '../../components/settings/UserList.tsx';
import { adminAuthRefresh, logoutCurrentUser } from '../../lib/api';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const validTabs = ['users', 'configuration', 'datasets', 'integrations'];
  const fragment = hash.slice(1);
  const activeTab = validTabs.includes(fragment) ? fragment : validTabs[0];
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

      <Tabs
        value={activeTab}
        onChange={(tab) => navigate({ hash: tab || 'users' }, { replace: true })}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUsers size={12} />}>
            {t('users_section', 'Users')}
          </Tabs.Tab>
          <Tabs.Tab value="configuration" leftSection={<IconKey size={12} />}>
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
        <Tabs.Panel value="configuration">
          <Configuration />
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
