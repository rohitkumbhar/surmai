import { Button, Card, Group, Skeleton, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { sendTestPrompt } from '../../lib/api';

export const TestPromptModal = () => {
  const [promptText, setPromptText] = useState<string>();
  const [promptResponse, setPromptResponse] = useState<string>();
  const [spinning, setSpinning] = useState<boolean>(false);

  const { t } = useTranslation();

  return (
    <Stack>
      <Textarea
        label={t('test_prompt', 'Test Prompt')}
        description={t('test_prompt_desc', 'Enter a small prompt to test your LLM connectivity')}
        data-autofocus
        onChange={(ev) => {
          setPromptText(ev.target.value);
        }}
      />
      {promptResponse && !spinning && <Card>{promptResponse}</Card>}
      {!promptResponse && spinning && <Skeleton height={20} radius="xl" />}
      <Group justify={'flex-end'}>
        <Button
          disabled={spinning}
          onClick={() => {
            if (promptText && promptText !== '') {
              setSpinning(true);
              sendTestPrompt(promptText)
                .then((result) => {
                  setPromptResponse(result);
                })
                .finally(() => {
                  setSpinning(false);
                });
            }
          }}
          mt="md"
        >
          Submit
        </Button>
      </Group>
    </Stack>
  );
};
