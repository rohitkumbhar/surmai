import {
  Button,
  Card,
  Collapse,
  Grid,
  Group,
  NumberInput,
  PasswordInput,
  Select,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconMail } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getSmtpSettings, sendTestEmail, updateSmtpSettings } from '../../lib/api';
import { showErrorNotification, showInfoNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';

import type { SmtpSettings } from '../../types/settings.ts';
import { useDisclosure } from '@mantine/hooks';

export const SmtpSettingsForm = () => {
  const { data: settings, refetch } = useQuery<SmtpSettings | undefined>({
    queryKey: ['getSmtpSettings'],
    queryFn: () => getSmtpSettings(),
  });
  const { t } = useTranslation();
  const [opened, { open: openForm, close: closeForm }] = useDisclosure(settings?.enabled);

  const initialValues: SmtpSettings = {
    senderName: settings?.senderName,
    senderAddress: settings?.senderAddress,
    enabled: !!settings?.enabled,
    host: settings?.host,
    localName: settings?.localName || (window.location.hostname !== 'localhost' ? window.location.hostname : undefined),
    password: '',
    port: settings?.port,
    tls: !!settings?.tls,
    username: settings?.username,
    authMethod: settings?.authMethod || 'PLAIN',
    applicationUrl: settings?.applicationUrl || 'http://surmai.local',
  };

  const form = useForm<SmtpSettings & { tlsValue?: string }>({
    mode: 'uncontrolled',
    initialValues: { ...initialValues, tlsValue: initialValues?.tls ? 'true' : 'false' },
  });

  form.watch('enabled', ({ value }) => {
    if (value) {
      openForm();
    } else {
      closeForm();
    }
  });

  const handleSubmission = (values: SmtpSettings & { tlsValue?: string }) => {
    if (settings) {
      updateSmtpSettings(values)
        .then(() => {
          refetch().then(() => {
            showSaveSuccessNotification({
              title: t('smtp_settings', 'SMTP Settings'),
              message: t('smtp_settings_updated', 'SMTP Settings updated'),
            });
          });
        })
        .catch((err) => {
          showErrorNotification({
            error: err,
            title: t('smtp_settings', 'SMTP Settings'),
            message: t('smtp_settings_update_failed', 'SMTP Settings could not be updated'),
          });
        });
    }
  };

  useEffect(() => {
    form.setValues({ ...(settings as SmtpSettings), tlsValue: initialValues?.tls ? 'true' : 'false' });
    form.resetDirty(settings);
  }, [settings]);

  return (
    <Card withBorder>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <Group justify="space-between" gap="xl" key={'smtp_settings'}>
          <div>
            <Text>{t('smtp_settings', 'SMTP Settings')}</Text>
            <Text size="sm" c="dimmed">
              {t('smtp_settings_description', 'Manage your mail server configuration')}
            </Text>
          </div>
          <Switch
            onLabel="ON"
            offLabel="OFF"
            size="lg"
            key={form.key('enabled')}
            {...form.getInputProps('enabled', { type: 'checkbox' })}
          />
          <Collapse expanded={opened}>
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  name={'senderName'}
                  label={t('smtp_sender_name', 'Sender Name')}
                  description={t('smtp_sender_name_description', 'Name of the sender')}
                  required
                  key={form.key('senderName')}
                  {...form.getInputProps('senderName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  name={'senderAddress'}
                  label={t('smtp_sender_address', 'Sender Address')}
                  description={t('smtp_sender_address_description', 'Email address of the sender')}
                  required
                  type={'email'}
                  key={form.key('senderAddress')}
                  {...form.getInputProps('senderAddress')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
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
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  name={'host'}
                  label={t('smtp_host', 'Host')}
                  description={t('smtp_host_description', 'Domain name of the SMTP server')}
                  required
                  key={form.key('host')}
                  {...form.getInputProps('host')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
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
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  name={'localName'}
                  label={t('smtp_local_name', 'Local Server Name')}
                  description={t('smtp_local_name_description', 'Local domain name. Default is localhost')}
                  required
                  type={'domain'}
                  key={form.key('localName')}
                  {...form.getInputProps('localName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  name={'username'}
                  label={t('smtp_username', 'Username')}
                  description={t('smtp_username_desc', 'Username for the SMTP server')}
                  key={form.key('username')}
                  {...form.getInputProps('username')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <PasswordInput
                  name={'password'}
                  label={t('smtp_password', 'Password')}
                  description={t('smtp_password_desc', 'Password for the SMTP server')}
                  key={form.key('password')}
                  {...form.getInputProps('password')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('smtp_auth_method', 'Auth Method')}
                  key={form.key('authMethod')}
                  {...form.getInputProps('authMethod')}
                  description={t('smtp_auth_method_desc', 'Select the AUTH method for your SMTP server')}
                  placeholder=""
                  data={['PLAIN', 'LOGIN']}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
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
              </Grid.Col>
            </Grid>
          </Collapse>
          <Group mt={'md'} justify={'flex-end'} w={'100%'}>
            <Button
              type={'button'}
              w={'min-content'}
              leftSection={<IconMail size={14} />}
              disabled={!settings?.enabled}
              onClick={() => {
                sendTestEmail()
                  .then(() => {
                    showInfoNotification({
                      title: t('smtp_test_email', 'SMTP Settings'),
                      message: t('smtp_test_email_queued', 'Test email has been queued.'),
                    });
                  })
                  .catch((err) => {
                    showErrorNotification({
                      error: err,
                      title: t('smtp_test_email', 'SMTP Settings'),
                      message: t('smtp_test_email_not_queued', 'Test email could not be sent.'),
                    });
                  });
              }}
            >
              {t('send_test_email', 'Send test email')}
            </Button>
            <Button
              type={'submit'}
              w={'min-content'}
              leftSection={<IconDeviceFloppy size={14} />}
              disabled={!form.isDirty()}
            >
              {t('save', 'Save')}
            </Button>
          </Group>
        </Group>
      </form>
    </Card>
  );
};
