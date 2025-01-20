import { Activity, CreateActivity } from '../../../types/trips.ts';
import { pb } from './pocketbase.ts';

import { convertSavedToBrowserDate } from '../../time.ts';

export const listActivities = async (tripId: string): Promise<Activity[]> => {
  const results = await pb.collection('activities').getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'startDate',
  });

  // @ts-expect-error type is correct
  return results.items.map((entry) => {
    return {
      ...entry,
      startDate: convertSavedToBrowserDate(entry.startDate),
    };
  });
};

export const createActivityEntry = (payload: CreateActivity): Promise<Activity> => {
  return pb.collection('activities').create(payload);
};

export const updateActivityEntry = (activityId: string, payload: CreateActivity): Promise<Activity> => {
  return pb.collection('activities').update(activityId, payload);
};

export const deleteActivity = (activityId: string) => {
  return pb.collection('activities').delete(activityId);
};

export const saveActivityAttachments = (activityId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments', f));
  return pb.collection('activities').update(activityId, formData);
};
