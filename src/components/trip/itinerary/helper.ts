import { Activity, ItineraryLine, Lodging, Transportation } from '../../../types/trips.ts';
import dayjs from 'dayjs';

export const buildTransportationIndex = (transportations: Transportation[]) => {
  const transportationIndex: { [key: string]: Array<Transportation> } = {};
  transportations?.forEach((tr) => {
    const start = dayjs(tr.departureTime).startOf('day');
    const end = dayjs(tr.arrivalTime).endOf('day');
    for (let m = dayjs(start); m.isBefore(end); m = m.add(1, 'day')) {
      const key = m.toISOString();
      let value = transportationIndex[key];
      if (!value) {
        transportationIndex[key] = [];
        value = transportationIndex[key];
      }
      const exists = value?.find((entry) => entry.id === tr.id);
      if (!exists) {
        transportationIndex[key].push(tr);
      }
    }
  });
  return transportationIndex;
};

export const buildLodgingIndex = (lodgings: Lodging[]) => {
  const lodgingIndex: { [key: string]: Array<Lodging> } = {};
  lodgings?.forEach((lodging) => {
    const start = dayjs(lodging.startDate).startOf('day');
    const end = dayjs(lodging.endDate).endOf('day');
    for (let m = dayjs(start); m.isBefore(end); m = m.add(1, 'day')) {
      const key = m.toISOString();
      let value = lodgingIndex[key];
      if (!value) {
        lodgingIndex[key] = [];
        value = lodgingIndex[key];
      }
      const exists = value?.find((entry) => entry.id === lodging.id);
      if (!exists) {
        lodgingIndex[key].push(lodging);
      }
    }
  });
  return lodgingIndex;
};

export const buildActivitiesIndex = (activities: Activity[]) => {
  const lodgingIndex: { [key: string]: Array<Activity> } = {};
  activities?.forEach((activity) => {
    const start = dayjs(activity.startDate).startOf('day');

    // for (let m = dayjs(start); m.isBefore(end); m = m.add(1, 'day')) {
    const key = start.toISOString();
    let value = lodgingIndex[key];
    if (!value) {
      lodgingIndex[key] = [];
      value = lodgingIndex[key];
    }
    const exists = value?.find((entry) => entry.id === activity.id);
    if (!exists) {
      lodgingIndex[key].push(activity);
    }
    // }
  });
  return lodgingIndex;
};

export function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}

export const compareItineraryLine = (a: ItineraryLine, b: ItineraryLine) => {
  // @ts-expect-error types
  const aStart: Date = a.departureTime || a.startDate;
  // @ts-expect-error types
  const bStart: Date = b.departureTime || b.startDate;
  return aStart.getTime() - bStart.getTime();
};
