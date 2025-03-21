import { CreateLodging, Lodging } from '../../../types/trips.ts';
import { pb } from './pocketbase.ts';
import { convertSavedToBrowserDate } from '../../time.ts';

const lodgings = pb.collection('lodgings');

export const listLodgings = async (tripId: string): Promise<Lodging[]> => {
  const results = await lodgings.getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'startDate',
  });

  return results.items.map((entry) => {
    return {
      ...entry,
      startDate: convertSavedToBrowserDate(entry.startDate),
      endDate: convertSavedToBrowserDate(entry.endDate),
    } as unknown as Lodging;
  });
};

export const createLodgingEntry = (payload: CreateLodging): Promise<Lodging> => {
  return lodgings.create(payload);
};

export const updateLodgingEntry = (lodgingId: string, payload: CreateLodging): Promise<Lodging> => {
  return lodgings.update(lodgingId, payload);
};

export const deleteLodging = (lodgingId: string) => {
  return lodgings.delete(lodgingId);
};

export const saveLodgingAttachments = (lodgingId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments+', f));
  return lodgings.update(lodgingId, formData);
};

export const deleteLodgingAttachments = (lodgingId: string, fileName: string) => {
  return lodgings.update(lodgingId, {
    'attachments-': [fileName],
  });
};
