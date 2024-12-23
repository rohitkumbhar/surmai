import { Lodging } from '../../../types/trips.ts';
import dayjs, { Dayjs } from 'dayjs';
import { Badge, Group, rem, Text } from '@mantine/core';
import { formatTime } from '../common/util.ts';
import { typeIcons } from '../lodging/typeIcons.ts';

export const LodgingLine = ({ lodging, day }: { lodging: Lodging; day: Dayjs }) => {
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[lodging.type] || IconCar;

  const showStartTime = dayjs(lodging.startDate).startOf('day').isSame(day);
  const showEndTime = dayjs(lodging.endDate).endOf('day').isSame(day.endOf('day'));

  return (
    <Group p={'sm'} bd={'1px solid var(--mantine-primary-color-light)'}>
      <TypeIcon
        title={lodging.type}
        style={{
          color: 'var(--mantine-primary-color-4)',
          width: rem(20),
          height: rem(20),
        }}
      />
      {showStartTime && <Badge radius={'xs'}>{formatTime(lodging.startDate)}</Badge>}
      {showStartTime && <Text>{`Check-In at ${lodging.name}`}</Text>}
      {showEndTime && <Text>{`Check-Out at ${lodging.name}`}</Text>}
      {!(showStartTime || showEndTime) && <Text>{`Stay at ${lodging.name}`}</Text>}
      {showEndTime && <Badge radius={'xs'}>{formatTime(lodging.endDate)}</Badge>}
    </Group>
  );
};
