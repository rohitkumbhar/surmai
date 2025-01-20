import { Card, Group, Switch, Text, Title } from '@mantine/core';
import classes from '../../pages/Settings/Settings.module.css';
import { areSignupsEnabled, disableUserSignups, enableUserSignups } from '../../lib/api';
import { useEffect, useState } from 'react';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';
import { useTranslation } from 'react-i18next';

export const UsersSettings = () => {
  const [signupsEnabled, setSignupsEnabled] = useState<boolean>(true);
  const { t } = useTranslation();
  useEffect(() => {
    areSignupsEnabled().then((result) => setSignupsEnabled(result));
  }, []);

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        {t('users_section', 'Users')}
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        {t('users_section_description', 'Manage site users')}
      </Text>

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
              disableUserSignups().then(() => {
                setSignupsEnabled(false);
                showSaveSuccessNotification({
                  title: t('settings', 'Settings'),
                  message: t('user_signups_disable', 'User signups disabled'),
                });
              });
            } else {
              enableUserSignups().then(() => {
                setSignupsEnabled(true);
                showSaveSuccessNotification({
                  title: t('settings', 'Settings'),
                  message: t('user_signups_enable', 'User signups enabled'),
                });
              });
            }
          }}
        />
      </Group>
    </Card>
  );
};
