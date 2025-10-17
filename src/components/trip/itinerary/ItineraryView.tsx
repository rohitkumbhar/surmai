import { Accordion, Badge, Button, Card, Group, rem, Stack, Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityLine } from './ActivityLine.tsx';
import { buildActivitiesIndex, buildLodgingIndex, buildTransportationIndex, compareItineraryLine } from './helper.ts';
import { LodgingLine } from './LodgingLine.tsx';
import { TransportationLine } from './TransportationLine.tsx';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';

import type { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';

const getDailyItinerary = (
  day: string,
  transportationItinerary: { [key: string]: Array<Transportation> },
  lodgingsItinerary: { [key: string]: Array<Lodging> },
  activitiesItinerary: { [key: string]: Array<Activity> }
): Array<ItineraryLine> => {
  const d = dayjs(day);
  const daily = [
    ...(transportationItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'transportation', day: d })),
    ...(lodgingsItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'lodging', day: d })),
    ...(activitiesItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'activity', day: d })),
  ];
  return daily.sort(compareItineraryLine);
};

const getItineraryForDuration = (
  startDay: string,
  endDay: string,
  transportationItinerary: { [key: string]: Array<Transportation> },
  lodgingsItinerary: { [key: string]: Array<Lodging> },
  activitiesItinerary: { [key: string]: Array<Activity> }
): Record<PropertyKey, ItineraryLine[] | undefined> => {
  let expanded: ItineraryLine[] = [];
  for (let m = dayjs(startDay); m.isBefore(endDay) || m.isSame(endDay); m = m.add(1, 'day')) {
    expanded = [
      ...expanded,
      ...getDailyItinerary(m.toISOString(), transportationItinerary, lodgingsItinerary, activitiesItinerary),
    ];
  }
  return Object.groupBy(expanded, ({ day }: ItineraryLine) => {
    return day.startOf('day').format('YYYYMMDD');
  });
};

export const ItineraryView = ({ trip }: { trip: Trip }) => {
  const tripId = trip.id;
  const { t } = useTranslation();

  const { data: activities } = useQuery<{ [key: string]: Activity[] }>({
    queryKey: ['buildActivitiesIndex', tripId],
    queryFn: async () => {
      const activitiesResult = await listActivities(tripId || '');
      return buildActivitiesIndex(activitiesResult);
    },
  });

  const { data: transportations } = useQuery<{ [key: string]: Transportation[] }>({
    queryKey: ['buildTransportationIndex', tripId],
    queryFn: async () => {
      const transportationsResult = await listTransportations(tripId || '');
      return buildTransportationIndex(transportationsResult);
    },
  });

  const { data: lodgings } = useQuery<{ [key: string]: Lodging[] }>({
    queryKey: ['buildLodgingIndex', tripId],
    queryFn: async () => {
      const lodgingsResult = await listLodgings(tripId || '');
      return buildLodgingIndex(lodgingsResult);
    },
  });

  const [itineraryEntries, setItineraryEntries] = useState<[string, ItineraryLine[] | undefined][]>();
  const [selectedPanels, setSelectedPanels] = useState<string[]>();

  const tripStart = dayjs(trip.startDate).startOf('day');
  const currentDay = dayjs();
  const [itineraryStart, setItineraryStart] = useState(
    dayjs(trip.startDate).isBefore(currentDay) && currentDay.isBefore(dayjs(trip.endDate))
      ? currentDay.startOf('day')
      : tripStart
  );
  const [itineraryEnd, setItineraryEnd] = useState(itineraryStart.add(1, 'day'));

  useEffect(() => {
    const itineraryForDuration = getItineraryForDuration(
      itineraryStart.format('YYYYMMDD'),
      itineraryEnd.format('YYYYMMDD'),
      transportations || {},
      lodgings || {},
      activities || {}
    );
    setItineraryEntries(Object.entries(itineraryForDuration));
    setSelectedPanels(Object.keys(itineraryForDuration));
  }, [transportations, lodgings, activities, itineraryStart, itineraryEnd]);

  const today = currentDay.format('YYYYMMDD');

  return (
    <Stack mt={'md'}>
      {itineraryEntries && (
        <Accordion chevronPosition={'right'} variant={'separated'} multiple={true} mt={'sm'} value={selectedPanels}>
          {itineraryEntries.map(([start, lines]) => {
            return (
              <Accordion.Item value={start} key={'top_' + start}>
                <Accordion.Control
                  icon={
                    <IconCalendar
                      style={{
                        color: 'var(--mantine-primary-color-6)',
                        width: rem(20),
                        height: rem(20),
                      }}
                    />
                  }
                >
                  <Group wrap="nowrap">
                    <div>
                      <Text>{dayjs(start).format('LL')}</Text>
                    </div>
                    {start === today && <Badge variant={'dot'}>{t('today', 'Today')}</Badge>}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    {(lines || []).map((entry: ItineraryLine) => {
                      return (
                        <Fragment key={entry.id}>
                          {entry.itineraryType === 'transportation' && (
                            <TransportationLine transportation={entry as Transportation} day={entry.day} />
                          )}
                          {entry.itineraryType === 'lodging' && (
                            <LodgingLine lodging={entry as Lodging} day={entry.day} />
                          )}
                          {entry.itineraryType === 'activity' && (
                            <ActivityLine activity={entry as Activity} day={entry.day} />
                          )}
                        </Fragment>
                      );
                    })}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
      {selectedPanels && selectedPanels.length === 0 && (
        <Card>
          <Text>
            {t('nothing_on_the_agenda', 'Nothing on the agenda between {{start}} and {{end}}', {
              start: dayjs(itineraryStart).format('LL'),
              end: dayjs(itineraryEnd).format('LL'),
            })}
          </Text>
        </Card>
      )}
      <Group justify={'space-between'} mt={'sm'}>
        <Button
          onClick={() => {
            setItineraryStart(itineraryStart.add(-1, 'day'));
          }}
        >
          {t('show_previous_day', 'Show Previous Day')}
        </Button>
        <Button
          onClick={() => {
            setItineraryEnd(itineraryEnd.add(1, 'day'));
          }}
        >
          {t('show_next_day', 'Show Next Day')}
        </Button>
      </Group>
    </Stack>
  );
};
