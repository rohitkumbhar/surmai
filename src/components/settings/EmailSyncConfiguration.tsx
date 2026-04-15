import {
  Button,
  Card,
  Collapse,
  Grid,
  Group,
  NumberInput,
  PasswordInput,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getSettingsForKey, setSettingsForKey, testImapConnectivity, triggerEmailSync } from '../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';

export type EmailSyncConfiguration = {
  enabled?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
};

const settingsKey = 'email_sync_config';

export const EmailSyncConfiguration = () => {
  const { t } = useTranslation();

  const { data: emailSyncConfig, refetch } = useQuery({
    queryKey: ['getSettingsForKey', settingsKey],
    queryFn: () => getSettingsForKey<EmailSyncConfiguration>(settingsKey),
  });

  const [opened, { open: openForm, close: closeForm }] = useDisclosure(emailSyncConfig?.enabled);

  const form = useForm<EmailSyncConfiguration>({
    mode: 'uncontrolled',
    initialValues: {
      enabled: !!emailSyncConfig?.enabled,
      imapHost: emailSyncConfig?.imapHost,
      imapPort: emailSyncConfig?.imapPort,
      imapUser: emailSyncConfig?.imapUser,
      imapPassword: emailSyncConfig?.imapPassword,
    },
  });

  useEffect(() => {
    if (emailSyncConfig?.enabled) {
      form.setValues({
        enabled: emailSyncConfig?.enabled,
        imapHost: emailSyncConfig?.imapHost,
        imapPort: emailSyncConfig?.imapPort,
        imapUser: emailSyncConfig?.imapUser,
        imapPassword: emailSyncConfig?.imapPassword,
      });
      openForm();
    }
  }, [emailSyncConfig]);

  form.watch('enabled', ({ value }) => {
    if (value) {
      openForm();
    } else {
      closeForm();
    }
  });

  const handleSubmission = async (values: EmailSyncConfiguration) => {
    const payload = {
      enabled: values.enabled,
      imapHost: values.imapHost,
      imapPort: values.imapPort,
      imapUser: values.imapUser,
      imapPassword: values.imapPassword,
    };

    setSettingsForKey(settingsKey, payload)
      .then(() => {
        showSaveSuccessNotification({
          title: t('success', 'Success'),
          message: t('email_sync_config_saved', 'Email integration settings saved'),
        });
      })
      .then(() => refetch())
      .catch((error) => {
        showErrorNotification({
          title: t('failed', 'Failed'),
          message: t('email_sync_config_failed', 'Error occurred while saving email integration settings'),
          error,
        });
      });
  };

  return (
    <Card withBorder>
      <div style={{ width: '100%' }}>
        <form onSubmit={form.onSubmit(handleSubmission)}>
          <Group justify="space-between">
            <div>
              <Text>{t('enable_email_sync', 'Enable Email Sync')}</Text>
              <Text size="sm" c="dimmed">
                {t(
                  'enable_email_sync_description',
                  'Configure the server and credentials of the monitored email address.'
                )}
              </Text>
              <Text size="sm" c="dimmed">
                {t('openai_endpoint_required', 'This features requires the OenAI endpoint to be enabled as well.')}
              </Text>
            </div>
            <Switch
              mb={'sm'}
              onLabel="ON"
              offLabel="OFF"
              size="lg"
              key={form.key('enabled')}
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />
          </Group>
          <Collapse in={opened}>
            <Grid mt={'md'}>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required={true}
                  key={form.key('imapHost')}
                  {...form.getInputProps('imapHost')}
                  label={t('imap_host', 'IMAP Host')}
                  description={t('imap_host_desc', 'FQDN of your IMAP server')}
                  placeholder="imap.example.com"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  required={true}
                  key={form.key('imapPort')}
                  {...form.getInputProps('imapPort')}
                  label={t('imap_port', 'Port')}
                  description={t('imap_port_desc', 'Port for the IMAP server')}
                  placeholder="993"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  required={true}
                  key={form.key('imapUser')}
                  {...form.getInputProps('imapUser')}
                  label={t('imap_username', 'Username')}
                  description={t('imap_user_desc', 'Username for the account')}
                  placeholder="user@example.com"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <PasswordInput
                  required={true}
                  key={form.key('imapPassword')}
                  {...form.getInputProps('imapPassword')}
                  label={t('imap_password', 'Password')}
                  description={t('imap_password_desc', 'Password for the user')}
                  placeholder="••••••••"
                />
              </Grid.Col>
            </Grid>
          </Collapse>
          <Group mt={'xl'} justify="flex-end">
            <Button
              variant={'outline'}
              onClick={() => {
                triggerEmailSync()
                  .then(() => {
                    showSaveSuccessNotification({
                      title: t('success', 'Success'),
                      message: t('triggered_email_sync_job', `Started an email sync request`),
                    });
                  })
                  .catch((error) => {
                    showErrorNotification({
                      error,
                      title: t('failed', 'Failed'),
                      message: t('connection_failed', 'Connection failed'),
                    });
                  });
              }}
            >
              {t('trigger_email_sync', 'Trigger Email Sync')}
            </Button>
            <Button
              variant={'outline'}
              onClick={() => {
                testImapConnectivity()
                  .then((unreadEmailCount) => {
                    showSaveSuccessNotification({
                      title: t('success', 'Success'),
                      message: t(
                        'connection_successful',
                        `Connection successful. Unread email count: {{ unreadEmailCount }}`,
                        { unreadEmailCount }
                      ),
                    });
                  })
                  .catch((error) => {
                    showErrorNotification({
                      error,
                      title: t('failed', 'Failed'),
                      message: t('connection_failed', 'Connection failed'),
                    });
                  });
              }}
            >
              {t('test_imap_connection', 'Test Connection')}
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
        </form>
      </div>
    </Card>
  );
};
