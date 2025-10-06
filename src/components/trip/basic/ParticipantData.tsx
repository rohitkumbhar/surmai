import { Avatar, Box, Group, Paper, Popover, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChevronDown } from '@tabler/icons-react';
import { forwardRef, useState } from 'react';

import { updateTrip } from '../../../lib/api';

import type { Participant, Trip } from '../../../types/trips.ts';

const ParticipantButton = forwardRef<HTMLDivElement, { name: string; email?: string }>((props, ref) => {
  const { name, email } = props;
  return (
    <div ref={ref}>
      <Paper shadow={'sm'} p={'xs'} bd={'1px solid var(--mantine-primary-color-2)'}>
        <Group>
          <Avatar key={name} name={name} color="initials" />
          <div>
            <Text fz="md" fw={500}>
              {name}
            </Text>
            <Text fz="xs" c="dimmed">
              {email || 'No e-mail'}
            </Text>
          </div>
          <IconChevronDown stroke={1} />
        </Group>
      </Paper>
    </div>
  );
});

export const ParticipantData = ({
  participant,
  trip,
  index,
  refetch,
}: {
  participant: Participant;
  trip: Trip;
  index: number;
  refetch: () => void;
}) => {
  const { name, email } = participant;
  const [participantEmail, setParticipantEmail] = useState<string | undefined>(participant.email);

  const form = useForm<{ email?: string; collaborator?: boolean }>({
    mode: 'uncontrolled',
    initialValues: {
      email: email,
    },
    validate: {},
  });

  const handleSubmit = (values: { email?: string; collaborator?: boolean }) => {
    setParticipantEmail(values.email);
    const data = { ...trip };

    if (data.participants && data.participants[index]) {
      const updatedParticipant = data.participants[index];
      updatedParticipant.email = values.email;
      updateTrip(trip.id, data).then(() => {
        refetch();
      });
    }
  };

  return (
    <Popover
      width={300}
      trapFocus
      position="bottom"
      withArrow
      shadow="md"
      onClose={() => {
        if (form.isDirty()) {
          handleSubmit(form.getValues());
        }
      }}
    >
      <Popover.Target>
        <Box>
          <ParticipantButton name={name} email={participantEmail} />
        </Box>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            type={'email'}
            label="Email"
            size="sm"
            mt="xs"
            key={form.key('email')}
            {...form.getInputProps('email')}
          />
        </form>
      </Popover.Dropdown>
    </Popover>
  );
};
