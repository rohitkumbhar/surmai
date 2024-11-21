import { Container, Group, Paper, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { Header } from '../../components/nav/Header.tsx';

export const Settings = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('settings', 'Settings'));

  return (
    <Container size={"xl"}>
      <Header>
        <Text size="md" p={'sm'}>
          {t('settings', 'Settings')}
        </Text>
      </Header>
      <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'}>

        <Group wrap="nowrap" mt={'sm'}>
          <p>Site Base Url</p>
          <p>Smtp Settings</p>
          <p>Data Control</p>
          <p>Disable Registration</p>
          <p>Create User</p>
        </Group>

        <Group wrap="nowrap" gap={10} mt={3}></Group>
      </Paper>
    </Container>
  );
};
