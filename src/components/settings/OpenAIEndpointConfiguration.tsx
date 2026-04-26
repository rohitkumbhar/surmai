import { Button, Card, Collapse, Grid, Group, Modal, PasswordInput, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { TestPromptModal } from './TestPromptModal.tsx';
import { getSettingsForKey, setSettingsForKey } from '../../lib/api';
import { showErrorNotification, showSaveSuccessNotification } from '../../lib/notifications.tsx';

export type OpenAIEndpointConfig = {
  enabled?: boolean;
  endpoint?: string;
  apiKey?: number;
  model?: string;
};

const settingsKey = 'openai_endpoint_config';

export const OpenAIEndpointConfiguration = () => {
  const { t } = useTranslation();

  const { data: openAiEndpointConfig, refetch } = useQuery({
    queryKey: ['getSettingsForKey', settingsKey],
    queryFn: () => getSettingsForKey<OpenAIEndpointConfig>(settingsKey),
  });

  const [opened, { open: openForm, close: closeForm }] = useDisclosure(openAiEndpointConfig?.enabled);
  const [modalOpen, { open: openTestPromptModal, close: closeTestPromptModal }] = useDisclosure(false);

  const form = useForm<OpenAIEndpointConfig>({
    mode: 'uncontrolled',
    initialValues: {
      enabled: !!openAiEndpointConfig?.enabled,
      endpoint: openAiEndpointConfig?.endpoint,
      apiKey: openAiEndpointConfig?.apiKey,
      model: openAiEndpointConfig?.model,
    },
  });

  useEffect(() => {
    if (openAiEndpointConfig?.enabled) {
      form.setValues({
        enabled: openAiEndpointConfig?.enabled,
        endpoint: openAiEndpointConfig?.endpoint,
        apiKey: openAiEndpointConfig?.apiKey,
        model: openAiEndpointConfig?.model,
      });
      openForm();
    }
  }, [openAiEndpointConfig]);

  form.watch('enabled', ({ value }) => {
    if (value) {
      openForm();
    } else {
      closeForm();
    }
  });

  const handleSubmission = async (values: OpenAIEndpointConfig) => {
    const payload = {
      enabled: values.enabled,
      endpoint: values.endpoint,
      apiKey: values.apiKey,
      model: values.model,
    };

    setSettingsForKey(settingsKey, payload)
      .then(() => {
        showSaveSuccessNotification({
          title: t('success', 'Success'),
          message: t('ai_endpoint_config_saved', 'AI Endpoint configuration saved'),
        });
      })
      .then(() => refetch())
      .catch((error) => {
        showErrorNotification({
          title: t('failed', 'Failed'),
          message: t('ai_endpoint_config_failed', 'Error occurred while saving OpenAI Endpoint settings'),
          error,
        });
      });
  };

  return (
    <>
      <Modal
        opened={modalOpen}
        size={'lg'}
        onClose={() => {
          closeTestPromptModal();
        }}
        title={t('enter_prompt', 'Enter a simple prompt')}
      >
        <TestPromptModal />
      </Modal>
      <Card withBorder>
        <div style={{ width: '100%' }}>
          <form onSubmit={form.onSubmit(handleSubmission)}>
            <Group justify="space-between">
              <div>
                <Text>{t('enable_openai_endpoint', 'OpenAI Compatible Endpoint')}</Text>
                <Text size="sm" c="dimmed">
                  {t(
                    'enable_openai_endpoint_desc',
                    'Configure the URL and credentials of an OpenAI compatible LLM provider'
                  )}
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
              <Grid mt={'sm'}>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    key={form.key('endpoint')}
                    {...form.getInputProps('endpoint')}
                    label={t('endpoint_url', 'OpenAI Compatible Endpoint')}
                    description={t('endpoint_url_desc', 'Base url for the OpenAI compatible endpoint')}
                    placeholder="http://ollama:11434/v1"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <PasswordInput
                    key={form.key('apiKey')}
                    {...form.getInputProps('apiKey')}
                    label={t('api_key', 'API Key')}
                    description={t('api_key_desc', 'Set your API Key if required')}
                    placeholder="sk_32323..."
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    required={true}
                    key={form.key('model')}
                    {...form.getInputProps('model')}
                    label={t('llm_model', 'Model')}
                    description={t('llm_model_desc', 'LLM Model of your choice.')}
                    placeholder="gpt-oss:20b"
                  />
                </Grid.Col>
              </Grid>
            </Collapse>
            <Group mt={'xl'} justify="flex-end">
              <Button
                variant={'outline'}
                onClick={() => {
                  openTestPromptModal();
                }}
              >
                {t('test_prompt', 'Test Prompt')}
              </Button>
              <Button type={'submit'} leftSection={<IconDeviceFloppy size={14} />}>
                {t('save', 'Save')}
              </Button>
            </Group>
          </form>
        </div>
      </Card>
    </>
  );
};
