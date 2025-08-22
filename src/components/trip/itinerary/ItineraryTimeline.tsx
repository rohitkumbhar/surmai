import { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import { Timeline, Text, Group, Badge, Box, rem, Stack, Card, Anchor } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';
import { compareItineraryLine } from './helper.ts';
import { typeIcons as transportationIcons } from '../transportation/typeIcons.ts';
import { typeIcons as lodgingIcons } from '../lodging/typeIcons.ts';
import { IconActivity, IconCar } from '@tabler/icons-react';
import { formatDateTime } from '../../../lib/time.ts';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

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
  }, [activities, lodgings, transportations]);

  const getTimelineIcon = (item: ItineraryLine) => {
    if (item.itineraryType === 'transportation') {
      const transportation = item as Transportation;
      // @ts-expect-error Icon type
      const TypeIcon = transportationIcons[transportation.type] || IconCar;
      return (
        <TypeIcon
          stroke={0.5}

          style={{
            width: rem(20),
            height: rem(20),
          }}
        />
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      // @ts-expect-error Icon type
      const TypeIcon = lodgingIcons[lodging.type] || IconCar;
      return (
        <TypeIcon
          stroke={0.5}
          style={{
            width: rem(20),
            height: rem(20),
          }}
        />
      );
    } else {
      return (
        <IconActivity
          stroke={0.5}
          style={{
            width: rem(20),
            height: rem(20),
          }}
        />
      );
    }
  };

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
          <Badge radius={'xs'} color="blue">
            {transportation.type}
          </Badge>
        </Group>
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      return (
        <Group>
          <Text fw={500}>{lodging.name}</Text>
          <Badge radius={'xs'} color="green">
            {lodging.type}
          </Badge>
        </Group>
      );
    } else {
      const activity = item as Activity;
      return (
        <Group>
          <Text fw={500}>{activity.name}</Text>
          <Badge radius={'xs'} color="orange">
            {t('activity', 'Activity')}
          </Badge>
        </Group>
      );
    }
  };

  const getTimelineContent = (item: ItineraryLine) => {
    if (item.itineraryType === 'transportation') {
      const transportation = item as Transportation;
      return (
        <Card withBorder p="xs" radius="md">
          <Card.Section p="xs">
            {getTimelineTitle(transportation)}
          </Card.Section>
          <Stack gap="xs" p="xs">
            <Group>
              <Text size="sm" fw={500}>{t('times', 'Times')}:</Text>
              <Text size="sm">{formatDateTime(transportation.departureTime)} - {formatDateTime(transportation.arrivalTime)}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={500}>{t('origin', 'Origin')}:</Text>
              <Anchor size="sm" href={createMapLink(transportation.origin)} target="_blank">
                {transportation.origin}
              </Anchor>
            </Group>
            <Group>
              <Text size="sm" fw={500}>{t('destination', 'Destination')}:</Text>
              <Anchor size="sm" href={createMapLink(transportation.destination)} target="_blank">
                {transportation.destination}
              </Anchor>
            </Group>
          </Stack>
        </Card>
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      return (
        <Card withBorder p="xs" radius="md">
          <Card.Section p="xs">
            {getTimelineTitle(lodging)}
          </Card.Section>
          <Stack gap="xs" p="xs">
            <Group>
              <Text size="sm" fw={500}>{t('times', 'Times')}:</Text>
              <Text size="sm">{formatDateTime(lodging.startDate)} - {formatDateTime(lodging.endDate)}</Text>
            </Group>
            {lodging.address && (
              <Group>
                <Text size="sm" fw={500}>{t('address', 'Address')}:</Text>
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
        <Card withBorder p="xs" radius="md">
          <Card.Section p="xs">
            {getTimelineTitle(activity)}
          </Card.Section>
          <Stack gap="xs" p="xs">
            <Group>
              <Text size="sm" fw={500}>{t('times', 'Times')}:</Text>
              <Text size="sm">
                {formatDateTime(activity.startDate)}
                {activity.endDate && ` - ${formatDateTime(activity.endDate)}`}
              </Text>
            </Group>
            {activity.description && (
              <Text size="sm">{activity.description}</Text>
            )}
            {activity.address && (
              <Group>
                <Text size="sm" fw={500}>{t('address', 'Address')}:</Text>
                <Anchor size="sm" href={createMapLink(activity.address)} target="_blank">
                  {activity.address}
                </Anchor>
              </Group>
            )}
          </Stack>
        </Card>
      );
    }
  };

  return (
    <Box p="md">
      <Timeline active={timelineItems.length} bulletSize={24} lineWidth={2}>
        {timelineItems.map((item) => (
          <Timeline.Item key={item.id} bullet={getTimelineIcon(item)}>
            {getTimelineContent(item)}
          </Timeline.Item>
        ))}
      </Timeline>
    </Box>
  );
}