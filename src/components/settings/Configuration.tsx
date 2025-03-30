import { Card, Group, LoadingOverlay, Switch, Text, Title } from '@mantine/core';
import classes from '../../pages/Settings/Settings.module.css';
import { disableUserSignups, enableUserSignups, getUsersMetadata } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';
import { useTranslation } from 'react-i18next';
import { OAuth2SettingsForm } from './OAuth2SettingsForm.tsx';
import { useQuery } from '@tanstack/react-query';

export const Configuration = () => {
  const {
    isPending,
    data: userModel,
    refetch,
  } = useQuery({
    queryKey: ['getUsersMetadata'],
    queryFn: () => getUsersMetadata(),
  });

  const signupsEnabled = userModel?.createRule === '';
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

        <Group justify="space-between" className={classes.item} gap="xl" key={'cities_dataset'}>
          <div>
            <Text>{t('new_user_signups_title', 'New User Signups')}</Text>
            <Text size="sm" c="dimmed">
              {t('new_user_signups_description', 'Allow users to sign up via the registration form')}
            </Text>
          </div>

          <Switch
            onLabel="ON"
            offLabel="OFF"
            className={classes.switch}
            size="lg"
            checked={signupsEnabled}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;
              if (!enabled) {
                disableUserSignups()
                  .then(() => refetch())
                  .then(() => {
                    showSaveSuccessNotification({
                      title: t('settings', 'Settings'),
                      message: t('user_signups_disabled', 'User signups disabled'),
                    });
                  });
              } else {
                enableUserSignups()
                  .then(() => refetch())
                  .then(() => {
                    showSaveSuccessNotification({
                      title: t('settings', 'Settings'),
                      message: t('user_signups_enabled', 'User signups enabled'),
                    });
                  });
              }
            }}
          />
        </Group>
        <Group mt={'xl'}>{userModel && <OAuth2SettingsForm oauthConfig={userModel?.oauth2} refetch={refetch} />}</Group>
      </div>
    </Card>
  );
};
