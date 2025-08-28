import { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  Stack,
  Text,
  Timeline, Title,
  Tooltip,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';
import { compareItineraryLine } from './helper.ts';
import { typeIcons as transportationIcons } from '../transportation/typeIcons.ts';
import { typeIcons as lodgingIcons } from '../lodging/typeIcons.ts';
import { IconActivity, IconArrowRight, IconCar, IconCheck, IconCopy } from '@tabler/icons-react';
import { formatDateShort, formatDateTime, formatTime } from '../../../lib/time.ts';
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
          size={12}
        />
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      // @ts-expect-error Icon type
      const TypeIcon = lodgingIcons[lodging.type] || IconCar;
      return (
        <TypeIcon
          stroke={1.5}
          size={12}
        />
      );
    } else {
      return (
        <IconActivity
          size={12}
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
    if (item.itineraryType === 'transportation') {
      const transportation = item as Transportation;
      return (
        <Card withBorder radius="md">
          {/*<Card.Section p="md">
            {getTimelineTitle(transportation)}
          </Card.Section>*/}
          <Card.Section pt={'md'}>
            <Group justify={'space-evenly'}>
              <Stack align={'center'} gap={'xs'}>
                <Button size={'xl'}
                        variant={'outline'}>{transportation.metadata?.origin?.iataCode || transportation.origin}
                </Button>
                <Text>{formatDateShort(transportation.departureTime)}
                <Text><Text>{formatTime(transportation.departureTime)}</Text></Text>
                </Text>
              </Stack>

              <IconArrowRight />
              <Stack align={'center'} gap={'xs'}>
                <Button size={'xl'}
                        variant={'outline'}>{transportation.metadata?.destination?.iataCode || transportation.destination}</Button>
                <Text>{formatDateShort(transportation.arrivalTime)}
                  <Text><Text>{formatTime(transportation.arrivalTime)}</Text></Text>
                </Text>
              </Stack>
            </Group>
            <Divider  />
          </Card.Section>
          <Card.Section pt={'xs'}>
            <Title pl={'sm'} order={4}>{t('flight_number', 'Flight Number')}</Title>
            <CopyButton value={transportation?.metadata?.reservation} timeout={2000}>
              {({ copied, copy }) => (
                <>
                  <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right" component={'a'}>
                    <Button onClick={copy} variant={'subtle'} >
                      {transportation?.metadata?.reservation}
                      <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Button>

                  </Tooltip>
                </>
              )}
            </CopyButton>
          </Card.Section>
         {/* <Stack gap="xs">
            <Group>
              <Text
                size="sm">{formatDateTime(transportation.departureTime)} - {formatDateTime(transportation.arrivalTime)}</Text>
            </Group>
            <Group gap={'xs'}>
              <Text size="sm">{t('origin', 'Origin')}:</Text>
              <Anchor size="sm" href={createMapLink(transportation.metadata?.origin?.name || transportation.origin)}
                      target="_blank">
                {transportation.metadata?.origin?.name || transportation.origin}
              </Anchor>
            </Group>
            <Group gap={'xs'}>
              <Text size="sm">{t('destination', 'Destination')}:</Text>
              <Anchor size="sm"
                      href={createMapLink(transportation.metadata?.destination?.name || transportation.destination)}
                      target="_blank">
                {transportation.metadata?.destination?.name || transportation.destination}
              </Anchor>
            </Group>
            <Group gap={'xs'}>
              {transportation?.metadata?.reservation &&

                <Group>
                  <Text>{t('flight_number', 'Flight Number')}</Text>
                  <CopyButton value={transportation?.metadata?.reservation} timeout={2000}>
                    {({ copied, copy }) => (
                      <>
                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right" component={'a'}>
                          <Button onClick={copy} variant={'subtle'} size={'compact-sm'}>
                            {transportation?.metadata?.reservation}
                            <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </ActionIcon>
                          </Button>

                        </Tooltip>
                      </>
                    )}
                  </CopyButton>
                </Group>

              }
              {transportation?.metadata?.flightNumber &&
                <Text size="sm">{transportation?.metadata?.flightNumber}</Text>}
              {transportation?.metadata?.seats && <Text size="sm">{transportation?.metadata?.seats}</Text>}
            </Group>
          </Stack>*/}
        </Card>
      );
    } else if (item.itineraryType === 'lodging') {
      const lodging = item as Lodging;
      return (
        <Card withBorder radius="md">
          <Card.Section p={'md'}>
            {getTimelineTitle(lodging)}
          </Card.Section>
          <Stack gap="xs">
            <Group>
              <Text size="sm">{formatDateTime(lodging.startDate)} - {formatDateTime(lodging.endDate)}</Text>
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
        <Card withBorder radius="md">
          <Card.Section p={'md'}>
            {getTimelineTitle(activity)}
          </Card.Section>
          <Stack gap="xs">
            <Group>
              <Text size="sm">
                {formatDateTime(activity.startDate)}
                {activity.endDate && ` - ${formatDateTime(activity.endDate)}`}
              </Text>
            </Group>
            {activity.description && (
              <Text size="sm">{activity.description}</Text>
            )}
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
      <Timeline active={timelineItems.length} bulletSize={18} lineWidth={1}>
        {timelineItems.map((item) => (
          <Timeline.Item key={item.id} bullet={getTimelineIcon(item)}>
            {getTimelineContent(item)}
          </Timeline.Item>
        ))}
      </Timeline>
    </Box>
  );
};