import { Button, Collapse, Group, Select, Switch, Text, TextInput } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { getSettingsForKey, setSettingsForKey } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export type FlightInfoProviderSettings = {
  enabled: boolean;
  provider?: 'adsdb_com' | 'flightaware';
  apiKey?: string;
};

const settingsKey = 'flight_info_provider';

export const FlightInfoProviderSettings = () => {
  const { t } = useTranslation();
  const {
    data: flightInfo,
    refetch,
  } = useQuery({
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

  const handleSubmission = (values: FlightInfoProviderSettings) => {
    console.log('values', values);

    const payload = {
      enabled: values.enabled,
      provider: values.provider,
      apiKey: values.apiKey,
    };

    setSettingsForKey(settingsKey, payload);
    refetch();


  };

  return (
    <div style={{ width: '100%' }}>
      <Text mb={'md'}>{t('flight_info', 'Flight Information')}</Text>
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
              label={t(settingsKey, 'Flight Info Provider')}
              description={t('flight_info_provider_desc', 'Select Flight Info Provider')}
              data={[
                { value: 'adsbdb', label: 'adsbdb.com' },
                { value: 'flightaware', label: 'flightaware.com' },
              ]}
              key={form.key('provider')}
              miw={'200px'}
              required
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
