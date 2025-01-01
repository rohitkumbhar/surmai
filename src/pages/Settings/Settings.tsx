import { Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { Header } from '../../components/nav/Header.tsx';
import { UsersSettings } from '../../components/settings/UsersSettings.tsx';
import { Datasets } from '../../components/settings/Datasets.tsx';
import { SmtpSettingsForm } from '../../components/settings/SmtpSettingsForm.tsx';
import { useEffect } from 'react';
import { adminAuthRefresh, logoutCurrentUser } from '../../lib';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(t('site_settings', 'Site Settings'));

  useEffect(() => {
    adminAuthRefresh().catch(() => {
      console.error("Could not refresh admin credentials. Logging out");
      logoutCurrentUser().then(() => {
        navigate(0);
      });
    })
  }, [navigate]);

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('site_settings', 'Site Settings')}
        </Text>
      </Header>
      <Datasets />
      <SmtpSettingsForm />
      <UsersSettings />
    </Container>
  );
};
