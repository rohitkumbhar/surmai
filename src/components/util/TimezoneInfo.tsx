import { calculateTimezoneDifference } from '../../lib/time.ts';
import { Badge, Group, HoverCard, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { IconClock } from '@tabler/icons-react';
import { useCurrentUser } from '../../auth/useCurrentUser.ts';

export const TimezoneInfo = ({ timezone }: { timezone?: string }) => {
  const { t } = useTranslation();

  const { user } = useCurrentUser();
  const timezoneDiff = calculateTimezoneDifference(user, timezone || dayjs.tz.guess());

  return (
    <Group>
      <HoverCard width={200} shadow="md">
        <HoverCard.Target>
          <Badge variant={'light'} radius={'sm'} leftSection={<IconClock size={12} />} px={'xs'} size={'sm'}>
            {timezone || 'Unknown'}
          </Badge>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap={'md'}>
            {!timezone && <Text size={'sm'}>{t('no_tz', 'Timezone information is unavailable')}</Text>}
            {timezone && timezoneDiff === 0 && (
              <Text size={'sm'}>
                {t('tz_no_diff', 'There is no difference in your timezone and the timezone at this destination')}
              </Text>
            )}
            {timezoneDiff < 0 && (
              <Text size={'sm'}>
                {t('tz_behind', 'Your timezone is {{diff}} hours behind', { diff: Math.abs(timezoneDiff) })}
              </Text>
            )}
            {timezoneDiff > 0 && (
              <Text size={'sm'}>{t('tz_ahead', 'Your timezone is {{diff}} hours ahead', { diff: timezoneDiff })}</Text>
            )}
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
};
