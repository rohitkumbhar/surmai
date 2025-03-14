import { pb } from './pocketbase.ts';
import { CreateTransportation, Transportation } from '../../../types/trips.ts';
import { convertSavedToBrowserDate } from '../../time.ts';

const transportations = pb.collection('transportations');

export const listTransportations = async (tripId: string): Promise<Transportation[]> => {
  const results = await transportations.getList(1, 50, {
    filter: `trip="${tripId}"`,
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
  files.forEach((f) => formData.append('attachments', f));
  return transportations.update(transportationId, formData);
};

export const deleteTransportationAttachment = (transportationId: string, fileName: string) => {
  return transportations.update(transportationId, {
    'attachments-': [fileName],
  });
};
