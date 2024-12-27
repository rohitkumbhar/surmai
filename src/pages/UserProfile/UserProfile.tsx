import { Container, Paper, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { UserSettingsForm } from '../../components/account/UserSettingsForm.tsx';
import { Header } from '../../components/nav/Header.tsx';
import { UserAvatarForm } from '../../components/account/UserAvatarForm.tsx';
import { ChangePasswordForm } from '../../components/account/ChangePasswordForm.tsx';

export const UserProfile = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('settings', 'Settings'));

  return (
    <Container size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('user_profile', 'User Profile')}
        </Text>
      </Header>
      <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'}>
        <Title order={3} fw={500}>
          {t('user.basic_info', 'Basic Information')}
        </Title>
        <Text fz="xs" c="dimmed" mt={3} mb="xl">
          {t('user.basic_info_desc', 'Update your basic information and preferences')}
        </Text>
        <UserAvatarForm />
        <UserSettingsForm />
      </Paper>

      <Paper withBorder radius="md" mt={'sm'} p="xl" bg={'var(--mantine-color-body)'}>
        <Title order={3} fw={500}>
          {t('user.security_info', 'Security')}
        </Title>
        <Text fz="xs" c="dimmed" mt={3} mb="xl">
          {t('user.security_info_desc', 'Update your security preferences')}
        </Text>
        <ChangePasswordForm />
      </Paper>
    </Container>
  );
};
