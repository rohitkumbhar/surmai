import { deleteAttachment } from './attachments.ts';
import { pb } from './pocketbase.ts';
import { convertSavedToBrowserDate } from '../../time.ts';

import type { CreateTransportation, Transportation } from '../../../types/trips.ts';

const transportations = pb.collection('transportations');

export const listTransportations = async (tripId?: string): Promise<Transportation[]> => {
  const filter = tripId ? `trip="${tripId}"` : undefined;
  const results = await transportations.getList(1, 1000, {
    filter,
    sort: 'departureTime',
  });

  return results.items.map((entry) => {
    return {
      ...entry,
      departureTime: convertSavedToBrowserDate(entry.departureTime),
      arrivalTime: convertSavedToBrowserDate(entry.arrivalTime),
    } as unknown as Transportation;
  });
};

export const listTransportationsByYear = async (year: string): Promise<Transportation[]> => {
  const filter = `trip.startDate >= "${year}-01-01 00:00:00" && trip.startDate <= "${year}-12-31 23:59:59"`;
  const results = await transportations.getList(1, 1000, {
    filter,
    sort: 'departureTime',
  });

  return results.items.map((entry) => {
    return {
      ...entry,
      departureTime: convertSavedToBrowserDate(entry.departureTime),
      arrivalTime: convertSavedToBrowserDate(entry.arrivalTime),
    } as unknown as Transportation;
  });
};

export const deleteTransportation = (transportationId: string) => {
  return transportations.delete(transportationId);
};

export const updateTransportation = (transportationId: string, data: CreateTransportation): Promise<Transportation> => {
  return transportations.update(transportationId, data);
};

export const createTransportationEntry = (payload: CreateTransportation): Promise<Transportation> => {
  return transportations.create(payload);
};

export const saveTransportationAttachments = (transportationId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments+', f));
  return transportations.update(transportationId, formData);
};

export const deleteTransportationAttachment = (transportationId: string, attachmentId: string) => {
  return transportations
    .update(transportationId, {
      'attachmentReferences-': [attachmentId],
    })
    .then(() => {
      return deleteAttachment(attachmentId);
    });
};
