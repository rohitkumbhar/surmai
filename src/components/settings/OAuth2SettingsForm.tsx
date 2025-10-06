import {
  Alert,
  Button,
  Code,
  Collapse,
  Group,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceFloppy, IconWebhook } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { apiUrl, setOAuth2Provider } from '../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';

import type { OAuthSettings, OAuthSettingsFormType } from '../../types/auth.ts';

interface OAuth2SettingsFormProps {
  oauthConfig?: OAuthSettings;
  refetch: () => void;
}

const oauthProviders = [
  { label: 'Google', value: 'google' },
  { label: 'Apple', value: 'apple' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OAuth2 Provider', value: 'oidc' },
];

export const OAuth2SettingsForm = ({ oauthConfig, refetch }: OAuth2SettingsFormProps) => {
  const { t } = useTranslation();
  const [opened, { open: openForm, close: closeForm }] = useDisclosure(oauthConfig?.enabled);

  const form = useForm<OAuthSettingsFormType>({
    mode: 'uncontrolled',
    initialValues: {
      enabled: !!oauthConfig?.enabled,
      name: oauthConfig?.providers?.[0]?.name,
      displayName: oauthConfig?.providers?.[0]?.displayName || oauthConfig?.providers?.[0]?.name,
      clientId: oauthConfig?.providers?.[0]?.clientId,
      clientSecret: oauthConfig?.providers?.[0]?.clientSecret,
      tokenURL: oauthConfig?.providers?.[0]?.tokenURL,
      authURL: oauthConfig?.providers?.[0]?.authURL,
      userInfoURL: oauthConfig?.providers?.[0]?.userInfoURL,
    },
  });

  form.watch('enabled', ({ value }) => {
    if (value) {
      openForm();
    } else {
      closeForm();
    }
  });

  const handleSubmission = (values: OAuthSettingsFormType) => {
    setOAuth2Provider(values)
      .then(() => refetch())
      .then(() => {
        showSaveSuccessNotification({
          title: t('oauth2_settings_form', 'OAuth2 Settings'),
          message: t('oauth_settings_updated', 'OAuth2 Settings updated'),
        });
      })
      .catch((err) => {
        showErrorNotification({
          error: err,
          title: t('oauth2_settings_form', 'OAuth2 Settings'),
          message: t('oauth_settings_update_failed', 'OAuth2 Settings could not be updated'),
        });
      });
  };

  return (
    <div style={{ width: '100%' }}>
      <Text mb={'md'}>{t('oauth2_settings_form', 'OAuth2 Settings')}</Text>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <Group justify="space-between">
          <div>
            <Text>{t('enable_oauth2_action', 'Enable OAuth2 Login')}</Text>
            <Text size="sm" c="dimmed">
              {t('enable_oauth2_action_description', 'Allow users to sign in via SSO')}
            </Text>
          </div>
          <Switch
            mb={'sm'}
            onLabel="ON"
            offLabel="OFF"
            // label={t('enable_oauth2_action', 'Enable OAuth2 Login')}
            size="lg"
            key={form.key('enabled')}
            {...form.getInputProps('enabled', { type: 'checkbox' })}
          />
        </Group>
        <Collapse in={opened}>
          <Alert title={t('oauth2_callback_url', 'Callback URL')} icon={<IconWebhook />} mb="lg" mt="lg">
            {t('callback_url_desc', 'The callback url for your setup is: ')}
            <Code>{`${apiUrl}/api/oauth2-redirect`}</Code>
          </Alert>
          <Group mt={'sm'}>
            <Select
              label={t('oauth_provider_label', 'OAuth2 Provider')}
              description={t('oauth_provider_description', 'Select OAuth2 Provider')}
              data={oauthProviders}
              key={form.key('name')}
              miw={'200px'}
              required
              {...form.getInputProps('name')}
            />

            <TextInput
              name={'displayName'}
              label={t('oauth_display_name', 'Display Name')}
              description={t('oauth_display_name_desc', 'Name displayed on the Login screen')}
              required
              miw={'300px'}
              key={form.key('displayName')}
              {...form.getInputProps('displayName')}
            />
          </Group>
          <Group mt={'sm'}>
            <TextInput
              name={'clientId'}
              label={t('oauth_client_id', 'Client Id')}
              description={t('oauth_client_id_desc', 'Client Id given by the provider')}
              required
              miw={'400px'}
              key={form.key('clientId')}
              {...form.getInputProps('clientId')}
            />

            <PasswordInput
              name={'clientSecret'}
              label={t('oauth_client_secret', 'Client Secret')}
              miw={'400px'}
              required={form.getValues().enabled}
              description={t('oauth_client_secret_desc', 'Client Secret given by the provider')}
              key={form.key('clientSecret')}
              {...form.getInputProps('clientSecret')}
            />
          </Group>
          <Stack mt={'sm'}>
            <TextInput
              name={'authURL'}
              label={t('oauth_auth_url', 'Auth URL')}
              type={'url'}
              required={form.getValues().name === 'oidc'}
              description={t('oauth_url_description', 'Authorization Endpoint')}
              key={form.key('authURL')}
              {...form.getInputProps('authURL')}
            />

            <TextInput
              name={'tokenURL'}
              label={t('oauth_token_url', 'Token URL')}
              type={'url'}
              required={form.getValues().name === 'oidc'}
              description={t('token_url_description', 'Token Endpoint')}
              key={form.key('tokenURL')}
              {...form.getInputProps('tokenURL')}
            />

            <TextInput
              name={'userInfoURL'}
              label={t('oauth_info_url', 'User Info URL')}
              type={'url'}
              description={t('oauth_info_url_description', 'User Info Endpoint')}
              key={form.key('userInfoURL')}
              {...form.getInputProps('userInfoURL')}
            />
          </Stack>
        </Collapse>
        <Group mt={'xl'} justify="space-between">
          <div></div>
          <Group>
            <Button type={'submit'} w={'min-content'} leftSection={<IconDeviceFloppy />} disabled={!form.isDirty()}>
              {t('save', 'Save')}
            </Button>
          </Group>
        </Group>
      </form>
    </div>
  );
};
