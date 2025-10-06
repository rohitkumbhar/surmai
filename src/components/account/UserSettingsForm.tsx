import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { ColorSchemeSelect } from './ColorSchemeSelect.tsx';
import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';
import { updateUser } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';
import { currencyCodes } from '../util/currencyCodes.ts';

import type { UserSettingsFormType } from '../../types/auth.ts';

export const UserSettingsForm = () => {
  const { user, reloadUser } = useCurrentUser();
  const { t, i18n } = useTranslation();

  const appCtx = useSurmaiContext();

  const initialValues: UserSettingsFormType = {
    name: user?.name,
    colorScheme: user?.colorScheme,
    currencyCode: user?.currencyCode || 'USD',
    timezone: user?.timezone || dayjs.tz.guess(),
    mapsProvider: user?.mapsProvider || 'openstreetmap',
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
        timezone: values.timezone,
        mapsProvider: values.mapsProvider,
      })
        .then(() => {
          appCtx.changeColor?.(values.colorScheme);
          reloadUser?.();
        })
        .then(() => {
          showSaveSuccessNotification({
            title: i18n.t('user_profile', 'User Profile'),
            message: i18n.t('user_settings_updated', 'User Setting updated'),
          });
        });
    }
  };

  return (
    <Stack mt={'sm'}>
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

        <Select
          mt={'sm'}
          name={'timezone'}
          label={t('timezone', 'Timezone')}
          description={t('timezone_desc', 'Your preferred timezone.')}
          data={Intl.supportedValuesOf('timeZone')}
          key={form.key('timezone')}
          {...form.getInputProps('timezone')}
          searchable
          withCheckIcon={false}
        ></Select>

        <Select
          mt={'sm'}
          name={'mapsProvider'}
          label={t('maps_provider', 'Preferred Maps')}
          description={t(
            'maps_provider_desc',
            'Your preferred Maps provider. This is used to generate links to different locations.'
          )}
          data={[
            { value: 'google', label: 'Google Maps' },
            { value: 'openstreetmap', label: 'Open Street Map (default)' },
          ]}
          key={form.key('mapsProvider')}
          {...form.getInputProps('mapsProvider')}
          withCheckIcon={false}
        ></Select>

        <Group justify={'flex-end'}>
          <Button mt="xl" type={'submit'} leftSection={<IconDeviceFloppy />}>
            {t('save', 'Save')}
          </Button>
        </Group>
      </form>
    </Stack>
  );
};
