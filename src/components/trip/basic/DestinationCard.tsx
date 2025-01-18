import { Destination, Trip } from '../../../types/trips.ts';
import { IconClock, IconMapPin } from '@tabler/icons-react';
import { Anchor, Badge, Card, Group, HoverCard, Stack, Text } from '@mantine/core';
import classes from './DestinationCard.module.css';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DestinationCard = ({ destination }: { destination: Destination; trip: Trip }) => {
  const { user } = useCurrentUser();
  const { t } = useTranslation();
  const [timezoneDiff, setTimezoneDiff] = useState<number>(0);

  const getMapsUrl = (destination: Destination): string => {
    if (user?.mapsProvider === 'google') {
      return `https://www.google.com/maps/place/${destination.name},${destination.stateName ? `+${destination.stateName},` : ''},${destination.countryName ? `+${destination.countryName}` : ''}`;
    }
    return `https://www.openstreetmap.org/search?query=${destination.name},${destination.stateName || ''},${destination.countryName}`;
  };

  const calculateTimezoneDifference = (timezone: string) => {
    const baseline = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const userTimezone = user?.timezone || dayjs.tz.guess();
    const destinationTimezoneInstant = dayjs.tz(baseline, timezone);
    const userTimezoneInstant = dayjs.tz(baseline, userTimezone);
    return destinationTimezoneInstant.diff(userTimezoneInstant, 'hours', true);
  };

  useEffect(() => {
    if (destination.timezone) {
      setTimezoneDiff(calculateTimezoneDifference(destination.timezone));
    }
  }, [user]);

  return (
    <Card withBorder radius="xs" className={classes.card} p={'xs'}>
      <Group justify="space-between">
        <div>
          <Text fw={500}>{destination.name}</Text>
          <Text fz="xs" c="dimmed">
            {`${destination.stateName ? destination.stateName + ',' : ' '} ${destination.countryName || 'Unspecified'} `}
          </Text>
        </div>
        <Anchor href={getMapsUrl(destination)} target={'_blank'}>
          <IconMapPin stroke={1.5} />
        </Anchor>
      </Group>

      <Card.Section className={classes.section} mt="xs">
        <Group>
          <HoverCard width={200} shadow="md">
            <HoverCard.Target>
              <Badge variant={'light'} radius={'sm'} leftSection={<IconClock size={12} />} px={'xs'} size={'sm'}>
                {destination.timezone || 'Unknown'}
              </Badge>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <Stack gap={'md'}>
                {!destination.timezone && <Text size={'sm'}>{t('no_tz', 'Timezone information is unavailable')}</Text>}
                {destination.timezone && timezoneDiff === 0 && (
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
                  <Text size={'sm'}>
                    {t('tz_ahead', 'Your timezone is {{diff}} hours ahead', { diff: timezoneDiff })}
                  </Text>
                )}
              </Stack>
            </HoverCard.Dropdown>
          </HoverCard>
        </Group>
      </Card.Section>
    </Card>
  );
};
