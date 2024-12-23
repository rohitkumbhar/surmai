import { Transportation } from '../../../types/trips.ts';
import { Badge, Group, rem, Text } from '@mantine/core';
import { typeIcons } from '../transportation/typeIcons.ts';
import { IconCar } from '@tabler/icons-react';
import dayjs, { Dayjs } from 'dayjs';
import { formatTime } from '../common/util.ts';


export const TransportationLine = ({ transportation, day }: { transportation: Transportation, day: Dayjs }) => {

  const type = transportation.type;

  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[type] || IconCar;

  const showStartTime = dayjs(transportation.departureTime).startOf('day').isSame(day);
  const showEndTime = dayjs(transportation.arrivalTime).endOf('day').isSame(day.endOf('day'));

  return (<Group p={'sm'} bd={'1px solid var(--mantine-primary-color-4)'}>
    <TypeIcon
      title={transportation.type}
      style={{
        color: 'var(--mantine-primary-color-4)',
        width: rem(20),
        height: rem(20),
      }} />

    {showStartTime && <Badge radius={"xs"}>{formatTime(transportation.departureTime)}</Badge>}
    <Text>{`${transportation.origin} to ${transportation.destination}`}</Text>
    {showEndTime && <Badge radius={"xs"}>{formatTime(transportation.arrivalTime)}</Badge>}
  </Group>);
};