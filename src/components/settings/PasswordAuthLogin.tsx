import { Card, Group, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { disablePasswordAuth, enablePasswordAuth } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';
import classes from '../../pages/Settings/Settings.module.css';

import type { UserModel } from '../../types/auth.ts';

export const PasswordAuthLogin = ({ userModel, refetch }: { userModel?: UserModel; refetch: () => void }) => {
  const { t } = useTranslation();

  return (
    <Card w={'100%'}>
      <Group justify="space-between" className={classes.item} gap="xl" key={'password_auth_settings'}>
        <div>
          <Text>{t('password_auth_toggle_label', 'Enable Password Login')}</Text>
          <Text size="sm" c="dimmed">
            {t('password_auth_toggle_description', 'Allow users to sign in via email and password')}
          </Text>
        </div>

        <Switch
          onLabel="ON"
          offLabel="OFF"
          className={classes.switch}
          size="lg"
          checked={userModel?.passwordAuth?.enabled}
          onChange={(event) => {
            const enabled = event.currentTarget.checked;
            if (enabled) {
              enablePasswordAuth()
                .then(() => refetch())
                .then(() => {
                  showSaveSuccessNotification({
                    title: t('settings', 'Settings'),
                    message: t('password_auth_enabled', 'Password authentication enabled'),
                  });
                });
            } else {
              disablePasswordAuth()
                .then(() => refetch())
                .then(() => {
                  showSaveSuccessNotification({
                    title: t('settings', 'Settings'),
                    message: t('password_auth_disabled', 'Password authentication disabled'),
                  });
                });
            }
          }}
        />
      </Group>
    </Card>
  );
};
