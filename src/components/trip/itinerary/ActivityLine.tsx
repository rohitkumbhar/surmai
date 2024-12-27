import { Activity } from '../../../types/trips.ts';
import dayjs, { Dayjs } from 'dayjs';
import { Badge, Box, Group, rem, Text } from '@mantine/core';
import { formatTime } from '../common/util.ts';
import { IconActivity } from '@tabler/icons-react';

export const ActivityLine = ({ activity, day }: { activity: Activity; day: Dayjs }) => {
  const showStartTime = dayjs(activity.startDate).startOf('day').isSame(day);

  return (
    <Group p={'sm'} bd={'1px solid var(--mantine-primary-color-light)'}>
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
    </Group>
  );
};
