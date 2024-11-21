import { Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { Header } from '../../components/nav/Header.tsx';
import { UsersSettings } from '../../components/settings/UsersSettings.tsx';
import { Datasets } from '../../components/settings/Datasets.tsx';

export const Settings = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('site_settings', 'Site Settings'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size="md" p={'sm'}>
          {t('site_settings', 'Site Settings')}
        </Text>
      </Header>
      <Datasets />
      <UsersSettings />
    </Container>
  );
};
