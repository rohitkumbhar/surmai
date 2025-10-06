import { Box, rem, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

export const PasswordRequirement = ({ meets, label }: { meets: boolean; label: string }) => {
  return (
    <Text c={meets ? 'teal' : 'red'} style={{ display: 'flex', alignItems: 'center' }} mt={7} size="sm">
      {meets ? (
        <IconCheck style={{ width: rem(14), height: rem(14) }} />
      ) : (
        <IconX style={{ width: rem(14), height: rem(14) }} />
      )}{' '}
      <Box component={'span'} ml={10}>
        {label}
      </Box>
    </Text>
  );
};
