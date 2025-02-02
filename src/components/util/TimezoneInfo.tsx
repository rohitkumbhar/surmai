import { User } from '../../types/auth.ts';
import { calculateTimezoneDifference } from '../../lib/time.ts';
import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export const TimezoneInfo = ({ user, timezone }: { user?: User; timezone?: string }) => {
  const { t } = useTranslation();
  const timezoneDiff = calculateTimezoneDifference(user, timezone || dayjs.tz.guess());

  return (
    <>
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
    </>
  );
};
