import { Button, Container, Group, PasswordInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconRefreshDot } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { updateUserAdminAction } from '../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';
import { FancyPasswordInput } from '../account/FancyPasswordInput.tsx';

import type { User } from '../../types/auth.ts';
import type { UseFormReturnType } from '@mantine/form';

export const ChangeUserPasswordForm = ({
  user,
  successFn,
  errorFn,
}: {
  user: User;
  successFn: () => void;
  errorFn: () => void;
}) => {
  const { t } = useTranslation();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      confirmPassword: (value, values) => {
        if (values.newPassword !== value) {
          return t('password_dont_match', 'Passwords do not match');
        }
        return null;
      },
    },
  });

  const handleSubmission = (values: { newPassword: string; confirmPassword: string }) => {
    updateUserAdminAction(user.id, {
      password: values.newPassword,
      passwordConfirm: values.confirmPassword,
    })
      .then(() => {
        showSaveSuccessNotification({
          title: t('user_settings_page', 'User Settings'),
          message: t('password_changed', 'Password Changed'),
        });
        successFn();
      })
      .catch((err) => {
        showErrorNotification({
          error: err,
          title: t('user_settings_page', 'User Settings'),
          message: t('password_not_changed', 'Password could not be changed'),
        });
        errorFn();
      });
  };

  return (
    <Container>
      <Text>{t('change_password_title', 'Changing password for {{name}}', { name: user.name })}</Text>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <FancyPasswordInput
          fieldName={'newPassword'}
          label={t('new_password', 'New Password')}
          description={t('new_password_desc_admin', 'Enter new password')}
          form={form as UseFormReturnType<unknown>}
        />
        <PasswordInput
          mt={'sm'}
          name={'confirmPassword'}
          label={t('new_password_confirm', 'Confirm New Password')}
          description={t('new_password_confirm_desc_admin', 'Confirm new password. Must match with the previous entry')}
          required
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />

        <Group justify={'flex-end'}>
          <Button mt="xl" type={'submit'} leftSection={<IconRefreshDot />}>
            {t('change_password_btm', 'Change Password')}
          </Button>
        </Group>
      </form>
    </Container>
  );
};
