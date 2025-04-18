import { pb } from './pocketbase.ts';
import { CreateTransportation, Transportation } from '../../../types/trips.ts';
import { convertSavedToBrowserDate } from '../../time.ts';
import { deleteAttachment } from './attachments.ts';

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

export const getHtmlFile = async (url: string) => {
  try {
    const response = await fetch(url);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  } catch (error) {
    console.error('Error fetching file:', error);
    throw error;
  }
};

export const getHtmlFile = async (url: string) => {
  try {
    const response = await fetch(url);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  } catch (error) {
    console.error('Error fetching file:', error);
    throw error;
  }
};
