import { Lodging } from '../../../types/trips.ts';
import dayjs, { Dayjs } from 'dayjs';
import { Anchor, Badge, Box, Group, rem, Stack, Text } from '@mantine/core';
import { typeIcons } from '../lodging/typeIcons.ts';
import { formatTime } from '../../../lib/time.ts';
import { useTranslation } from 'react-i18next';
import { getMapsLink } from '../../../lib/places.ts';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { IconMap2 } from '@tabler/icons-react';

export const LodgingLine = ({ lodging, day }: { lodging: Lodging; day: Dayjs }) => {
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[lodging.type] || IconCar;

  const showStartTime = dayjs(lodging.startDate).startOf('day').isSame(day);
  const showEndTime = dayjs(lodging.endDate).endOf('day').isSame(day.endOf('day'));
  const { t } = useTranslation();
  const { user } = useCurrentUser();

  return (
    <Stack bd={'1px solid var(--mantine-primary-color-light)'} gap={0}>
      <Group p={'sm'}>
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
        {showEndTime && <Badge radius={'xs'}>{formatTime(lodging.endDate)}</Badge>}
        {showStartTime && <Text>{t('check_in_at', 'Check-In at {{ name }}', { name: lodging.name })}</Text>}
        {showEndTime && <Text>{t('check_out_from', 'Check-Out from {{name }}', { name: lodging.name })}</Text>}
        {!(showStartTime || showEndTime) && <Text>{t('stay_at', 'Stay at {{ name }}', { name: lodging.name })}</Text>}
      </Group>
      {lodging.address && (
        <Group p={'sm'}>
          <Text size={'sm'} c={'dimmed'}>{`Address:`}</Text>
          <Anchor href={getMapsLink(user, lodging.address)} target={'_blank'}>
            <Group gap={0}>
              <Text size={'sm'} c={'var(--mantine-primary-color-9)'}>{`${lodging.address}`}</Text>
              <IconMap2 height={14} />
            </Group>
          </Anchor>
        </Group>
      )}
    </Stack>
  );
};
