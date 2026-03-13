import { pb } from './pocketbase.ts';

export type SaveEntityExpense = {
  name: string;
  cost: { value: number; currency: string };
  occurredOn: string;
  category: string;
};

export type SaveEntityPayload = {
  entityId?: string;
  expense?: SaveEntityExpense;
  existingExpenseId?: string;
  existingAttachmentIds?: string[];
  entityData: Record<string, unknown>;
};

const sendSaveEntityRequest = async (
  tripId: string,
  endpoint: string,
  payload: SaveEntityPayload,
  files: File[]
): Promise<unknown> => {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  files.forEach((f) => formData.append('files', f));

  return await pb.send(`/api/surmai/trip/${tripId}/${endpoint}`, {
    method: 'POST',
    body: formData,
  });
};

export const saveTransportation = (tripId: string, payload: SaveEntityPayload, files: File[]) => {
  return sendSaveEntityRequest(tripId, 'save-transportation', payload, files);
};

export const saveLodging = (tripId: string, payload: SaveEntityPayload, files: File[]) => {
  return sendSaveEntityRequest(tripId, 'save-lodging', payload, files);
};

export const saveActivity = (tripId: string, payload: SaveEntityPayload, files: File[]) => {
  return sendSaveEntityRequest(tripId, 'save-activity', payload, files);
};
