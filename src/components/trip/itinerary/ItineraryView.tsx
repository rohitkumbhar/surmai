import { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import { Accordion, Badge, Button, Group, rem, Stack, Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { Fragment, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';
import { buildActivitiesIndex, buildLodgingIndex, buildTransportationIndex, compareItineraryLine } from './helper.ts';
import { TransportationLine } from './TransportationLine.tsx';
import { LodgingLine } from './LodgingLine.tsx';
import { ActivityLine } from './ActivityLine.tsx';
import { useTranslation } from 'react-i18next';

export const ItineraryView = ({ trip }: { trip: Trip }) => {
  const tripId = trip.id;
  const { t } = useTranslation();
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['listActivities', tripId],
    queryFn: () => listActivities(tripId || ''),
  });

  const { data: transportations } = useQuery<Transportation[]>({
    queryKey: ['listTransportations', trip.id],
    queryFn: () => listTransportations(trip.id || ''),
  });

  const { data: lodgings } = useQuery<Lodging[]>({
    queryKey: ['listLodgings', tripId],
    queryFn: () => listLodgings(tripId || ''),
  });

  const [transportationItinerary, setTransportationItinerary] = useState<{ [key: string]: Array<Transportation> }>({});
  const [lodgingsItinerary, setLodgingItinerary] = useState<{ [key: string]: Array<Lodging> }>({});
  const [activitiesItinerary, setActivitiesItinerary] = useState<{ [key: string]: Array<Activity> }>({});

  const tripStart = dayjs(trip.startDate).startOf('day');

  const [itineraryStart, setItineraryStart] = useState(
    dayjs(trip.startDate).isBefore(dayjs()) && dayjs().isBefore(dayjs(trip.endDate))
      ? dayjs().startOf('day')
      : tripStart
  );
  const [itineraryEnd, setItineraryEnd] = useState(itineraryStart.add(1, 'day'));

  const getDailyItinerary = (day: string): Array<ItineraryLine> => {
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
    endDay: string
  ): Record<PropertyKey, ItineraryLine[] | undefined> => {
    let expanded: ItineraryLine[] = [];
    for (let m = dayjs(startDay); m.isBefore(endDay) || m.isSame(endDay); m = m.add(1, 'day')) {
      expanded = [...expanded, ...getDailyItinerary(m.toISOString())];
    }
    return Object.groupBy(expanded, ({ day }: ItineraryLine) => {
      return day.startOf('day').format('YYYYMMDD');
    });
  };

  useEffect(() => {
    if (transportations) {
      setTransportationItinerary(buildTransportationIndex(transportations));
    }

    if (lodgings) {
      setLodgingItinerary(buildLodgingIndex(lodgings));
    }

    if (activities) {
      setActivitiesItinerary(buildActivitiesIndex(activities));
    }
  }, [activities, lodgings, transportations, trip]);

  const [itineraryEntries, setItineraryEntries] = useState<[string, ItineraryLine[] | undefined][]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);

  useEffect(() => {
    const itineraryForDuration = getItineraryForDuration(
      itineraryStart.format('YYYYMMDD'),
      itineraryEnd.format('YYYYMMDD')
    );
    setItineraryEntries(Object.entries(itineraryForDuration));
    setSelectedPanels(Object.keys(itineraryForDuration));
  }, [transportationItinerary, lodgingsItinerary, activitiesItinerary, itineraryStart, itineraryEnd]);

  if (!selectedPanels.length) {
    return null;
  }

  const today = dayjs().format('YYYYMMDD');

  return (
    <Stack mt={'md'}>
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
