import { Group, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { disableUserSignups, enableUserSignups } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';
import classes from '../../pages/Settings/Settings.module.css';

import type { UserModel } from '../../types/auth.ts';

export const NewUserSignups = ({ userModel, refetch }: { userModel?: UserModel; refetch: () => void }) => {
  const { t } = useTranslation();
  const signupsEnabled = userModel?.createRule === '';

  return (
    <Group justify="space-between" className={classes.item} gap="xl" key={'new_user_signups'}>
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
  );
};
