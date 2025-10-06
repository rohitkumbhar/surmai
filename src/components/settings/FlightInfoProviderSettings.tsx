import { Button, Collapse, Group, Select, Skeleton, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSettingsForKey, setSettingsForKey } from '../../lib/api';
import { showSaveSuccessNotification } from '../../lib/notifications.tsx';

export type FlightInfoProviderSettings = {
  enabled: boolean;
  provider?: 'adsdb_com' | 'flightaware';
  apiKey?: string;
};

const settingsKey = 'flight_info_provider';

export const FlightInfoProviderSettings = () => {
  const { t } = useTranslation();
  const { data: flightInfo, refetch } = useQuery({
    queryKey: ['getSettingsForKey', settingsKey],
    queryFn: () => getSettingsForKey<FlightInfoProviderSettings>(settingsKey),
  });

  const [opened, { open: openForm, close: closeForm }] = useDisclosure(flightInfo?.enabled);
  const [apiKeyRequired, setApiKeyRequired] = useState(flightInfo?.provider === 'flightaware');

  const form = useForm<FlightInfoProviderSettings>({
    mode: 'uncontrolled',
    initialValues: {
      enabled: !!flightInfo?.enabled,
      provider: flightInfo?.provider,
      apiKey: flightInfo?.apiKey,
    },
  });

  useEffect(() => {
    if (flightInfo?.enabled) {
      form.setValues({
        enabled: !!flightInfo?.enabled,
        provider: flightInfo?.provider,
        apiKey: flightInfo?.apiKey,
      });
      // form.reset();
      openForm();
      console.log('opened form');
    }
  }, [flightInfo]);

  form.watch('enabled', ({ value }) => {
    if (value) {
      openForm();
    } else {
      closeForm();
    }
  });

  form.watch('provider', ({ value }) => {
    setApiKeyRequired(value === 'flightaware');
  });

  const handleSubmission = async (values: FlightInfoProviderSettings) => {
    console.log('values', values);

    const payload = {
      enabled: values.enabled,
      provider: values.provider,
      apiKey: values.apiKey,
    };

    setSettingsForKey(settingsKey, payload)
      .then(() => {
        showSaveSuccessNotification({
          title: t('flight_info_provider', 'Flight Info Provider'),
          message: t('flight_info_provider_success', 'Updated flight information provider configuration'),
        });
      })
      .then(() => refetch());
  };

  if (!flightInfo) {
    return <Skeleton></Skeleton>;
  }

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <Group justify="space-between">
          <div>
            <Text>{t('enable_flight_info', 'Enable Flight Information Integration')}</Text>
            <Text size="sm" c="dimmed">
              {t('enable_flight_info_description', 'Allow loading of flight information from third party services')}
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
          <Group mt={'sm'}>
            <Select
              label={t('flight_info_provider', 'Flight Info Provider')}
              description={t('flight_info_provider_desc', 'Select Flight Info Provider')}
              miw={'200px'}
              required
              data={[
                { value: 'adsbdb', label: 'adsbdb.com' },
                { value: 'flightaware', label: 'flightaware.com' },
              ]}
              key={form.key('provider')}
              {...form.getInputProps('provider')}
            />

            <TextInput
              name={'apiKey'}
              label={t('api_key', 'API Key')}
              description={t('api_key_desc', 'API Key for the integration')}
              required={apiKeyRequired}
              withAsterisk={apiKeyRequired}
              miw={'300px'}
              key={form.key('apiKey')}
              {...form.getInputProps('apiKey')}
            />
          </Group>
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
