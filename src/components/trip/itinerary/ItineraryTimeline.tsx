import { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import { Anchor, Box, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';
import { compareItineraryLine } from './helper.ts';
import { formatDateTime } from '../../../lib/time.ts';
import { useTranslation } from 'react-i18next';
import { Fragment, useEffect, useState } from 'react';
import { FlightCard } from './FlightCard.tsx';

// Helper function to create a Google Maps link from an address
const createMapLink = (address: string): string => {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

export const ItineraryTimeline = ({ trip }: { trip: Trip }) => {
  const { t } = useTranslation();
  const [timelineItems, setTimelineItems] = useState<ItineraryLine[]>([]);

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['listActivities', trip.id],
    queryFn: () => listActivities(trip.id || ''),
  });

  const { data: transportations } = useQuery<Transportation[]>({
    queryKey: ['listTransportations', trip.id],
    queryFn: () => listTransportations(trip.id || ''),
  });

  const { data: lodgings } = useQuery<Lodging[]>({
    queryKey: ['listLodgings', trip.id],
    queryFn: () => listLodgings(trip.id || ''),
  });

  useEffect(() => {
    const items: ItineraryLine[] = [
      ...(transportations || []).map((e) => ({ ...e, itineraryType: 'transportation' })),
      ...(lodgings || []).map((e) => ({ ...e, itineraryType: 'lodging' })),
      ...(activities || []).map((e) => ({ ...e, itineraryType: 'activity' })),
    ];

    setTimelineItems(items.sort(compareItineraryLine));

    // filter active item for date (default to current day)
    // past and future counts
  }, [activities, lodgings, transportations]);

  const getTimelineTitle = (item: ItineraryLine) => {
    if (item.itineraryType === 'transportation') {
      const transportation = item as Transportation;
      return (
        <Group>
          <Text fw={500}>
            {t('transportation_from_to', '{{ origin }} to {{ destination }}', {
              origin: transportation.origin,
              destination: transportation.destination,
            })}
          </Text>
        </Group>
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      return (
        <Group>
          <Text fw={500}>{lodging.name}</Text>
        </Group>
      );
    } else {
      const activity = item as Activity;
      return (
        <Group>
          <Text fw={500}>{activity.name}</Text>
        </Group>
      );
    }
  };

  const getTimelineContent = (item: ItineraryLine) => {
    if (item.itineraryType === 'transportation' && item.type !== 'car_rental') {
      return <FlightCard flight={item as Transportation} />;
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      return (
        <Card withBorder radius="md" maw={500}>
          <Card.Section p={'md'}>{getTimelineTitle(lodging)}</Card.Section>
          <Stack gap="xs">
            <Group>
              <Text size="sm">
                {formatDateTime(lodging.startDate)} - {formatDateTime(lodging.endDate)}
              </Text>
            </Group>
            {lodging.address && (
              <Group>
                <Anchor size="sm" href={createMapLink(lodging.address)} target="_blank">
                  {lodging.address}
                </Anchor>
              </Group>
            )}
          </Stack>
        </Card>
      );
    } else {
      const activity = item as Activity;
      return (
        <Card withBorder radius="md" maw={500}>
          <Card.Section p={'md'}>{getTimelineTitle(activity)}</Card.Section>
          <Stack gap="xs">
            <Group>
              <Text size="sm">
                {formatDateTime(activity.startDate)}
                {activity.endDate && ` - ${formatDateTime(activity.endDate)}`}
              </Text>
            </Group>
            {activity.description && <Text size="sm">{activity.description}</Text>}
            {activity.address && (
              <>
                <Divider />
                <Group>
                  {/*<Text size="sm" fw={500}>{t('address', 'Address')}:</Text>*/}
                  <Anchor size="sm" href={createMapLink(activity.address)} target="_blank">
                    {activity.address}
                  </Anchor>
                </Group>
              </>
            )}
          </Stack>
        </Card>
      );
    }
  };

  return (
    <Box pt={'md'}>
      <Stack gap={'xs'} p={0}>
        {timelineItems.map((item) => {
          return <Fragment key={item.id}>{getTimelineContent(item)}</Fragment>;
        })}
      </Stack>
    </Box>
  );
};
