import { Button, Text } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';

export const CopyDataButton = ({ text }: { text: string }) => {
  const clipboard = useClipboard({ timeout: 500 });

  return (
    <Button
      component={'a'}
      onClick={() => {
        clipboard.copy(text);
      }}
      variant={'subtle'}
      size={'md'}
      px={5}
      py={5}
    >
      <Text size={'sm'}>{text}</Text>&nbsp;
      {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
    </Button>
  );
};
