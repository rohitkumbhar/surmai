import { Activity, ItineraryLine, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import { Accordion, Group, Pagination, rem, Stack, Text } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { Fragment, useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib/api';
import {
  buildActivitiesIndex,
  buildLodgingIndex,
  buildTransportationIndex,
  chunk,
  compareItineraryLine,
} from './helper.ts';
import { TransportationLine } from './TransportationLine.tsx';
import { LodgingLine } from './LodgingLine.tsx';
import { ActivityLine } from './ActivityLine.tsx';

export const ItineraryView = ({ trip }: { trip: Trip }) => {
  const [tripWeeks, setTripWeeks] = useState<Array<Array<{ id: string; value: Dayjs }>>>([]);
  const [activePage, setPage] = useState(1);

  const tripId = trip.id;
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

  useEffect(() => {
    const days = [];
    const tripStart = dayjs(trip.startDate).startOf('day');
    const tripEnd = dayjs(trip.endDate).endOf('day');

    if (transportations) {
      setTransportationItinerary(buildTransportationIndex(transportations));
    }

    if (lodgings) {
      setLodgingItinerary(buildLodgingIndex(lodgings));
    }

    if (activities) {
      setActivitiesItinerary(buildActivitiesIndex(activities));
    }

    for (let m = dayjs(tripStart); m.isBefore(tripEnd); m = m.add(1, 'day')) {
      days.push({ id: m.format('YYYYMMDD'), value: m });
    }

    const weeks = chunk(days, 7);
    setTripWeeks(weeks);
  }, [activities, lodgings, transportations, trip]);

  const getDailyItinerary = (day: string): Array<ItineraryLine> => {
    const daily = [
      ...(transportationItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'transportation' })),
      ...(lodgingsItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'lodging' })),
      ...(activitiesItinerary[day] || []).map((e) => ({ ...e, itineraryType: 'activity' })),
    ];
    return daily.sort(compareItineraryLine);
  };

  return (
    <>
      <Pagination mt={'sm'} value={activePage} onChange={setPage} total={tripWeeks.length} withEdges />
      <Accordion chevronPosition="right" variant="separated" multiple={true} mt={'sm'}>
        {(tripWeeks[activePage - 1] || []).map((day) => {
          return (
            <Accordion.Item value={day.id} key={day.id}>
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
                    <Text>{day.value.format('LL')}</Text>
                    <Text c={'dimmed'} size={'xs'}>
                      {`Transportations: ${(transportationItinerary[day.value.toISOString()] || []).length}`} &nbsp;
                      {`Lodgings: ${(lodgingsItinerary[day.value.toISOString()] || []).length}`} &nbsp;
                      {`Activities: ${(activitiesItinerary[day.value.toISOString()] || []).length}`}
                    </Text>
                  </div>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  {getDailyItinerary(day.value.toISOString()).map((entry: ItineraryLine) => {
                    return (
                      <Fragment key={day.id}>
                        {entry.itineraryType === 'transportation' && (
                          <TransportationLine transportation={entry as Transportation} day={day.value} key={day.id} />
                        )}
                        {entry.itineraryType === 'lodging' && (
                          <LodgingLine lodging={entry as Lodging} day={day.value} key={day.id} />
                        )}
                        {entry.itineraryType === 'activity' && (
                          <ActivityLine activity={entry as Activity} day={day.value} key={day.id} />
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
    </>
  );
};
