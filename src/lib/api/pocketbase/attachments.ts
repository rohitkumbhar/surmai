import { pb } from './pocketbase.ts';

import type { Attachment } from '../../../types/trips.ts';

export const uploadAttachments = (tripId: string, files: File[]): Promise<Attachment[]> => {
  if (files.length === 0) {
    return Promise.resolve([]);
  }

  const batch = pb.createBatch();

  files.map((f) => {
    const formData = new FormData();
    formData.append('file', f);
    formData.append('trip', tripId);
    formData.append('name', f.name);
    batch.collection('trip_attachments').create(formData);
  });

  return batch.send().then((result) => {
    return result.map((r) => r.body as Attachment) as unknown as Attachment[];
  });
};

export const getTripAttachments = (tripId: string): Promise<Attachment[]> => {
  return pb
    .collection('trip_attachments')
    .getList(1, 100, {
      filter: `trip="${tripId}"`,
      sort: '-created',
    })
    .then((result) => result.items as unknown as Attachment[]);
};

export const deleteAttachment = (attachmentId: string) => {
  return pb.collection('trip_attachments').delete(attachmentId);
};
