import {
  Button,
  Card,
  Group,
  LoadingOverlay,
  NumberInput,
  PasswordInput,
  Select,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import classes from '../../pages/Settings/Settings.module.css';
import { useTranslation } from 'react-i18next';
import { useForm } from '@mantine/form';
import { getSmtpSettings, sendTestEmail, updateSmtpSettings } from '../../lib';
import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { IconDeviceFloppy, IconMail } from '@tabler/icons-react';

export type SmtpSettings = {
  enabled?: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: boolean;
  localName?: string;
  authMethod?: 'PLAIN' | 'LOGIN';
  senderName?: string;
  senderAddress?: string;
  applicationUrl?: string;
};

export const SmtpSettingsForm = () => {
  const {
    isPending,
    data: settings,
    refetch,
  } = useQuery<SmtpSettings | undefined>({
    queryKey: ['getSmtpSettings'],
    queryFn: () => getSmtpSettings(),
  });
  const { t } = useTranslation();

  const initialValues: SmtpSettings = {
    senderName: settings?.senderName,
    senderAddress: settings?.senderAddress,
    enabled: settings?.enabled,
    host: settings?.host,
    localName: settings?.localName || (window.location.hostname !== 'localhost' ? window.location.hostname : undefined),
    password: '',
    port: settings?.port,
    tls: settings?.tls,
    username: settings?.username,
    authMethod: settings?.authMethod || 'PLAIN',
    applicationUrl: settings?.applicationUrl || 'http://surmai.local',
  };

  const form = useForm<SmtpSettings & { tlsValue?: string }>({
    mode: 'uncontrolled',
    initialValues: { ...initialValues, tlsValue: initialValues?.tls === true ? 'true' : 'false' },
  });

  const handleSubmission = (values: SmtpSettings & { tlsValue?: string }) => {
    if (settings) {
      updateSmtpSettings(values)
        .then(() => {
          refetch().then(() => {
            notifications.show({
              title: t('smtp_settings', 'SMTP Settings'),
              message: t('smtp_settings_updated', 'SMTP Settings updated'),
              position: 'top-right',
            });
          });
        })
        .catch(() => {
          notifications.show({
            title: t('smtp_settings', 'SMTP Settings'),
            message: t('smtp_settings_update_failed', 'SMTP Settings could not be updated'),
            position: 'top-right',
          });
        });
    }
  };

  useEffect(() => {
    form.setValues(settings as SmtpSettings);
    form.resetDirty(settings);
  }, [settings]);

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        SMTP Settings
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        Manage your mail server configuration
      </Text>

      <Group justify="space-between" className={classes.item} gap="xl" key={'smtp_settings'}>
        <div style={{ width: '100%', position: 'relative' }}>
          <LoadingOverlay
            visible={isPending}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ type: 'bars' }}
          />
          <form onSubmit={form.onSubmit(handleSubmission)}>
            <Group>
              <Switch
                mb={'sm'}
                onLabel="ON"
                offLabel="OFF"
                label={t('smtp_enabled', 'Enable SMTP server')}
                className={classes.switch}
                size="md"
                key={form.key('enabled')}
                {...form.getInputProps('enabled', { type: 'checkbox' })}
              />
            </Group>
            <Group mt={'sm'}>
              <TextInput
                name={'senderName'}
                label={t('smtp_sender_name', 'Sender Name')}
                description={t('smtp_sender_name_description', 'Name of the sender')}
                required
                key={form.key('senderName')}
                {...form.getInputProps('senderName')}
              />

              <TextInput
                name={'senderAddress'}
                label={t('smtp_sender_address', 'Sender Address')}
                description={t('smtp_sender_name_description', 'Email address of the sender')}
                required
                type={'email'}
                key={form.key('senderAddress')}
                {...form.getInputProps('senderAddress')}
              />
              <TextInput
                name={'applicationUrl'}
                label={t('application_url', 'Application URL')}
                type={'url'}
                description={t(
                  'application_url_description',
                  'Base URL for this installation. Used to generate links in an email.'
                )}
                key={form.key('applicationUrl')}
                {...form.getInputProps('applicationUrl')}
              />
            </Group>
            <Group mt={'sm'}>
              <TextInput
                name={'host'}
                label={t('smtp_host', 'Host')}
                description={t('smtp_host_description', 'Domain name of the SMTP server')}
                required
                key={form.key('host')}
                {...form.getInputProps('host')}
              />
              <NumberInput
                hideControls={true}
                allowDecimal={false}
                name={'port'}
                label={t('smtp_port', 'Port')}
                description={t('smtp_port_description', 'Server Port. Default is 587 for TLS enabled server')}
                required
                key={form.key('port')}
                {...form.getInputProps('port')}
              />
              <TextInput
                name={'localName'}
                label={t('smtp_local_name', 'Local Server Name')}
                description={t('smtp_local_name', 'Local domain name. Default is localhost')}
                required
                type={'domain'}
                key={form.key('localName')}
                {...form.getInputProps('localName')}
              />
            </Group>
            <Group mt={'sm'}>
              <TextInput
                name={'username'}
                label={t('smtp_username', 'Username')}
                description={t('smtp_username_desc', 'Username for the SMTP server')}
                key={form.key('username')}
                {...form.getInputProps('username')}
              />
              <PasswordInput
                name={'password'}
                label={t('smtp_password', 'Password')}
                description={t('smtp_password_desc', 'Password for the SMTP server')}
                key={form.key('password')}
                {...form.getInputProps('password')}
              />

              <Select
                label={t('smtp_auth_method', 'Auth Method')}
                key={form.key('authMethod')}
                {...form.getInputProps('authMethod')}
                description={t('smtp_auth_method_desc', 'Select the AUTH method for your SMTP server')}
                placeholder=""
                data={['PLAIN', 'LOGIN']}
              />

              <Select
                label={t('smtp_tls_enabled', 'TLS Encryption')}
                description={t('smtp_tls_enabled_description', 'Enable Secure SMTP')}
                placeholder=""
                key={form.key('tlsValue')}
                {...form.getInputProps('tlsValue')}
                data={[
                  { value: 'false', label: '(Auto) StartTLS' },
                  { value: 'true', label: 'Always' },
                ]}
                onChange={(_value) => form.setFieldValue('tls', _value === 'true')}
              />
            </Group>
            <Group mt={'md'} justify="space-between">
              <div></div>
              <Group>
                <Button
                  type={'button'}
                  w={'min-content'}
                  leftSection={<IconMail />}
                  disabled={!settings?.enabled}
                  onClick={() => {
                    sendTestEmail().then(() => {
                      notifications.show({
                        title: t('smtp_test_email', 'Test Email'),
                        message: t('smtp_test_email_queued', 'Test email has been queued.'),
                        position: 'top-right',
                      });
                    });
                  }}
                >
                  {t('send_test_email', 'Send test email')}
                </Button>
                <Button type={'submit'} w={'min-content'} leftSection={<IconDeviceFloppy />}>
                  {t('save', 'Save')}
                </Button>
              </Group>
            </Group>
          </form>
        </div>
      </Group>
    </Card>
  );
};
