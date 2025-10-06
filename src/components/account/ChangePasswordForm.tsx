import { Button, Group, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconRefreshDot } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { FancyPasswordInput } from './FancyPasswordInput.tsx';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { isAdmin, updateAdminUser, updateUser } from '../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';

import type { UseFormReturnType } from '@mantine/form';

export type ChangePasswordFormSchema = {
  newPassword: string;
  newPasswordConfirm: string;
  oldPassword: string;
};

export const ChangePasswordForm = () => {
  const { user } = useCurrentUser();
  const { t } = useTranslation();

  const form = useForm<ChangePasswordFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    validate: {
      newPasswordConfirm: (value, values) => {
        return values.newPassword !== value ? 'Passwords do not match' : null;
      },
    },
  });

  const resetPassword = (values: ChangePasswordFormSchema) => {
    if (!user?.id) {
      return;
    }

    if (isAdmin()) {
      updateAdminUser({
        oldPassword: values.oldPassword,
        password: values.newPassword,
        passwordConfirm: values.newPasswordConfirm,
      })
        .then(() => {
          showSaveSuccessNotification({
            title: t('user_settings_page', 'User Settings'),
            message: t('admin_password_changed', 'Admin Password Changed'),
          });
        })
        .catch((err) => {
          showErrorNotification({
            error: err,
            title: t('user_settings_page', 'User Settings'),
            message: t('admin_password_not_changed', 'Admin Password could not be changed'),
          });
        });
    }

    updateUser(user.id, {
      oldPassword: values.oldPassword,
      password: values.newPassword,
      passwordConfirm: values.newPasswordConfirm,
    })
      .then(() => {
        showSaveSuccessNotification({
          title: t('user_settings_page', 'User Settings'),
          message: t('password_changed', 'Password Changed'),
        });
      })
      .catch((err) => {
        showErrorNotification({
          error: err,
          title: t('user_settings_page', 'User Settings'),
          message: t('password_not_changed', 'Password could not be changed'),
        });
      });
  };

  return (
    <form onSubmit={form.onSubmit((values) => resetPassword(values))}>
      <PasswordInput
        mt={'sm'}
        name={'oldPassword'}
        label={t('old_password', 'Existing Password')}
        description={t('old_password_desc', 'Enter your existing password')}
        required
        key={form.key('oldPassword')}
        {...form.getInputProps('oldPassword')}
      />

      <FancyPasswordInput
        fieldName={'newPassword'}
        label={t('new_password', 'New Password')}
        description={t('new_password_desc', 'Enter your new password')}
        form={form as UseFormReturnType<unknown>}
      />
      <PasswordInput
        mt={'sm'}
        name={'newPasswordConfirm'}
        label={t('new_password_confirm', 'Confirm New Password')}
        description={t('new_password_confirm_desc', 'Confirm your new password. Must match with the previous entry')}
        required
        key={form.key('newPasswordConfirm')}
        {...form.getInputProps('newPasswordConfirm')}
      />
      <Group justify={'flex-end'}>
        <Button mt="xl" type={'submit'} leftSection={<IconRefreshDot />}>
          {t('change_password_btm', 'Change Password')}
        </Button>
      </Group>
    </form>
  );
};
