import { Activity, CreateActivity } from '../../../types/trips.ts';
import { pb } from './pocketbase.ts';

import { convertSavedToBrowserDate } from '../../time.ts';

const activities = pb.collection('activities');
export const listActivities = async (tripId: string): Promise<Activity[]> => {
  const results = await activities.getList(1, 50, {
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
  return activities.create(payload);
};

export const updateActivityEntry = (activityId: string, payload: CreateActivity): Promise<Activity> => {
  return activities.update(activityId, payload);
};

export const deleteActivity = (activityId: string) => {
  return activities.delete(activityId);
};

export const saveActivityAttachments = (activityId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments+', f));
  return activities.update(activityId, formData);
};

export const deleteActivityAttachments = (activityId: string, fileName: string) => {
  return activities.update(activityId, {
    'attachments-': [fileName],
  });
};
