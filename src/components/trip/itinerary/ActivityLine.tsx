import { Anchor, Badge, Box, Group, rem, Stack, Text } from '@mantine/core';
import { IconActivity, IconMap2 } from '@tabler/icons-react';
import dayjs from 'dayjs';

import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { getMapsLink } from '../../../lib/places.ts';
import { formatTime } from '../../../lib/time.ts';

import type { Activity } from '../../../types/trips.ts';
import type { Dayjs } from 'dayjs';

export const ActivityLine = ({ activity, day }: { activity: Activity; day: Dayjs }) => {
  const showStartTime = dayjs(activity.startDate).startOf('day').isSame(day);
  const showEndTime = activity.endDate ? dayjs(activity.endDate).startOf('day').isSame(day) : false;
  const { user } = useCurrentUser();

  return (
    <Stack bd={'1px solid var(--mantine-primary-color-light)'} gap={0}>
      <Group p={'sm'}>
        <Box visibleFrom={'md'}>
          <IconActivity
            title={activity.type}
            style={{
              color: 'var(--mantine-primary-color-4)',
              width: rem(20),
              height: rem(20),
            }}
          />
        </Box>
        {showStartTime && <Badge radius={'xs'}>{formatTime(activity.startDate)}</Badge>}
        {<Text>{`${activity.name}`}</Text>}
        {showEndTime && activity.endDate && <Badge radius={'xs'}>{formatTime(activity.endDate)}</Badge>}
      </Group>

      {activity.address && (
        <Group p={'sm'}>
          <Text size={'sm'} c={'dimmed'}>{`Address:`}</Text>
          <Anchor href={getMapsLink(user, activity.address)} target={'_blank'}>
            <Group gap={0}>
              <Text size={'sm'} c={'var(--mantine-primary-color-9)'}>{`${activity.address}`}</Text>
              <IconMap2 height={14} />
            </Group>
          </Anchor>
        </Group>
      )}
    </Stack>
  );
};
