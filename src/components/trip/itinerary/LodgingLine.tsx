import { Lodging } from '../../../types/trips.ts';
import dayjs, { Dayjs } from 'dayjs';
import { Badge, Box, Group, rem, Text } from '@mantine/core';
import { typeIcons } from '../lodging/typeIcons.ts';
import { formatTime } from '../../../lib/time.ts';
import { useTranslation } from 'react-i18next';

export const LodgingLine = ({ lodging, day }: { lodging: Lodging; day: Dayjs }) => {
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[lodging.type] || IconCar;

  const showStartTime = dayjs(lodging.startDate).startOf('day').isSame(day);
  const showEndTime = dayjs(lodging.endDate).endOf('day').isSame(day.endOf('day'));
  const { t } = useTranslation();

  return (
    <Group p={'sm'} bd={'1px solid var(--mantine-primary-color-light)'}>
      <Box visibleFrom={'md'}>
        <TypeIcon
          title={lodging.type}
          style={{
            color: 'var(--mantine-primary-color-4)',
            width: rem(20),
            height: rem(20),
          }}
        />
      </Box>
      {showStartTime && <Badge radius={'xs'}>{formatTime(lodging.startDate)}</Badge>}
      {showStartTime && <Text>{t('check_in_at', 'Check-In at {{ name }}', { name: lodging.name })}</Text>}
      {showEndTime && <Text>{t('check_out_from', 'Check-Out from {{name }}', { name: lodging.name })}</Text>}
      {!(showStartTime || showEndTime) && <Text>{t('stay_at', 'Stay at {{ name }}', { name: lodging.name })}</Text>}
      {showEndTime && <Badge radius={'xs'}>{formatTime(lodging.endDate)}</Badge>}
    </Group>
  );
};
