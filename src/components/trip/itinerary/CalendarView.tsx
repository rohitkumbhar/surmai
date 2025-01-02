import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Activity, Lodging, Transportation, Trip } from '../../../types/trips.ts';
import { useQuery } from '@tanstack/react-query';
import { listActivities, listLodgings, listTransportations } from '../../../lib';

const localizer = momentLocalizer(moment);

export const CalendarView = ({ trip }: { trip: Trip }) => {
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

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const newEvents: any[] = [];

    activities?.forEach((activity) => {
      newEvents.push({
        title: activity.name,
        start: new Date(activity.startDate),
        end: new Date(activity.endDate),
        type: 'activity',
      });
    });

    transportations?.forEach((transportation) => {
      newEvents.push({
        title: transportation.name,
        start: new Date(transportation.departureTime),
        end: new Date(transportation.arrivalTime),
        type: 'transportation',
      });
    });

    lodgings?.forEach((lodging) => {
      newEvents.push({
        title: lodging.name,
        start: new Date(lodging.startDate),
        end: new Date(lodging.endDate),
        type: 'lodging',
      });
    });

    setEvents(newEvents);
  }, [activities, transportations, lodgings]);

  return (
    <div style={{ height: '100vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};
