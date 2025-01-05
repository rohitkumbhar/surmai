import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { useForm } from '@mantine/form';
import { UserSettingsFormType } from '../../types/auth.ts';
import { Box, Button, Group, Select, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ColorSchemeSelect } from './ColorSchemeSelect.tsx';
import { useContext } from 'react';
import { SurmaiContext } from '../../app/Surmai.tsx';
import { updateUser } from '../../lib';

import { currencyCodes } from '../util/currencyCodes.ts';

export const UserSettingsForm = () => {
  const { user, reloadUser } = useCurrentUser();
  const { t } = useTranslation();

  const appCtx = useContext(SurmaiContext);

  const initialValues: UserSettingsFormType = {
    name: user?.name,
    colorScheme: user?.colorScheme,
    currencyCode: user?.currencyCode || 'USD',
  };

  const form = useForm<UserSettingsFormType>({
    mode: 'uncontrolled',
    initialValues: initialValues,
  });

  const handleSubmission = (values: UserSettingsFormType) => {
    if (user?.id) {
      updateUser(user.id, {
        name: values.name,
        colorScheme: values.colorScheme,
        currencyCode: values.currencyCode,
      }).then(() => {
        appCtx.changeColor?.(values.colorScheme);
        reloadUser?.();
      });
    }
  };

  return (
    <Box mt={'sm'}>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <TextInput
          mt={'sm'}
          name={'name'}
          label={t('change_name', 'Name')}
          description={t('name_desc', 'Update your name as needed')}
          required
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        <ColorSchemeSelect formKey={form.key('colorScheme')} formProps={{ ...form.getInputProps('colorScheme') }} />

        <Select
          mt={'sm'}
          name={'currencyCode'}
          label={t('currency_code', 'Currency Code')}
          description={t('currency_code_desc', 'Set your default currency code')}
          key={form.key('currencyCode')}
          {...form.getInputProps('currencyCode')}
          data={currencyCodes}
          searchable
          withCheckIcon={false}
        />

        <Group justify={'flex-end'}>
          <Button mt="xl" type={'submit'}>
            {t('save', 'Save')}
          </Button>
        </Group>
      </form>
    </Box>
  );
};
