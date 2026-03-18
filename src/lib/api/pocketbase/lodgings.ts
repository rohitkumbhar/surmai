import { deleteAttachment } from './attachments.ts';
import { pb } from './pocketbase.ts';
import { convertSavedToBrowserDate } from '../../time.ts';

import type { CreateLodging, Lodging } from '../../../types/trips.ts';

const lodgings = pb.collection('lodgings');

export const listLodgings = async (tripId?: string): Promise<Lodging[]> => {
  const filter = tripId ? `trip="${tripId}"` : undefined;
  const results = await lodgings.getList(1, 1000, {
    filter,
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

export const listLodgingsByYear = async (year: string): Promise<Lodging[]> => {
  const filter = `trip.startDate >= "${year}-01-01 00:00:00" && trip.startDate <= "${year}-12-31 23:59:59"`;
  const results = await lodgings.getList(1, 1000, {
    filter,
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

export const deleteLodgingAttachments = (lodgingId: string, attachmentId: string) => {
  return lodgings
    .update(lodgingId, {
      'attachmentReferences-': [attachmentId],
    })
    .then(() => {
      return deleteAttachment(attachmentId);
    });
};
