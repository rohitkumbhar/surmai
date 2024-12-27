import { useForm, UseFormReturnType } from '@mantine/form';
import { FancyPasswordInput } from './FancyPasswordInput.tsx';
import { useTranslation } from 'react-i18next';
import { Button, Group, PasswordInput } from '@mantine/core';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { isAdmin, updateUser } from '../../lib';
import { notifications } from '@mantine/notifications';
import { updateAdminUser } from '../../lib';

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
      }).then(() => {
        notifications.show({
          title: t('admin_password_changed', 'Admin Password Changed'),
          message: t('admin_password_changed', 'Admin Password Changed'),
          position: 'top-right'
        });
      });
    }

    updateUser(user.id, {
      oldPassword: values.oldPassword,
      password: values.newPassword,
      passwordConfirm: values.newPasswordConfirm,
    }).then(() => {
      notifications.show({
        title: t('password_changed', 'Password Changed'),
        message: t('password_changed', 'Password Changed'),
        position: 'top-right'
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
        <Button mt="xl" type={'submit'}>
          {t('change_password_btm', 'Change Password')}
        </Button>
      </Group>
    </form>
  );
};
