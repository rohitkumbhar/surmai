import { pb } from './pocketbase.ts';
import {
  Collaborator,
  CreateLodging,
  CreateTransportation,
  Lodging,
  NewTrip,
  Transportation,
  Trip,
  TripResponse,
} from '../../../types/trips.ts';
import { listActivities } from './activities.ts';

import { convertSavedToBrowserDate } from '../../time.ts';
import { User } from '../../../types/auth.ts';

export const createTrip = async (data: NewTrip) => {
  return await pb.collection('trips').create(data);
};

export const getTrip = (tripId: string): Promise<Trip> => {
  return pb
    .collection('trips')
    .getOne<TripResponse>(tripId)
    .then((trip) => {
      const { startDate, endDate, ...rest } = trip;
      return {
        ...rest,
        startDate: new Date(Date.parse(startDate)),
        endDate: new Date(Date.parse(endDate)),
      };
    });
};

export const listTrips = async (): Promise<Trip[]> => {
  const results = await pb.collection('trips').getFullList<TripResponse>({
    sort: '-created',
    expand: 'collaborators',
  });
  return results.map((trip) => {
    const { expand, startDate, endDate, ...rest } = trip;
    return {
      ...rest,
      ...expand,
      startDate: new Date(Date.parse(startDate)),
      endDate: new Date(Date.parse(endDate)),
    };
  });
};

export const listCollaborators = ({ tripId }: { tripId: string }): Promise<User[]> => {
  return pb.send('/trip/collaborators', {
    method: 'GET',
    query: { tripId },
  });
};

export const updateTrip = (tripId: string, data: Trip) => {
  return pb.collection('trips').update(tripId, data);
};

export const listTransportations = async (tripId: string): Promise<Transportation[]> => {
  const results = await pb.collection('transportations').getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'departureTime',
  });

  // @ts-expect-error type is correct
  return results.items.map((entry) => {
    return {
      ...entry,
      departureTime: convertSavedToBrowserDate(entry.departureTime),
      arrivalTime: convertSavedToBrowserDate(entry.arrivalTime),
    };
  });
};

export const deleteTrip = (tripId: string) => {
  return pb.collection('trips').delete(tripId);
};

export const deleteTransportation = (transportationId: string) => {
  return pb.collection('transportations').delete(transportationId);
};

export const addFlight = (tripId: string, data: { [key: string]: any }): Promise<Transportation> => {
  const payload = {
    type: 'flight',
    origin: data.origin,
    destination: data.destination,
    cost: {
      value: data.cost,
      currency: data.currencyCode,
    },
    departureTime: data.departureTime?.toISOString(),
    arrivalTime: data.arrivalTime?.toISOString(),
    trip: tripId,
    metadata: JSON.stringify({
      airline: data.airline,
      flightNumber: data.flightNumber,
      confirmationCode: data.confirmationCode,
    }),
  };
  return pb.collection('transportations').create(payload);
};

export const updateTransportation = (transportationId: string, data: CreateTransportation): Promise<Transportation> => {
  return pb.collection('transportations').update(transportationId, data);
};

export const createTransportationEntry = (payload: CreateTransportation): Promise<Transportation> => {
  return pb.collection('transportations').create(payload);
};

export const saveTransportationAttachments = (transportationId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments', f));
  return pb.collection('transportations').update(transportationId, formData);
};

export const getAttachmentUrl = (record: any, fileName: string) => {
  return pb.files.getUrl(record, fileName);
};

export const deleteTransportationAttachment = (transportationId: string, fileName: string) => {
  return pb.collection('transportations').update(transportationId, {
    'attachments-': [fileName],
  });
};

export const uploadTripCoverImage = (tripId: string, coverImage: File | Blob) => {
  const formData = new FormData();
  formData.append('coverImage', coverImage);
  return pb.collection('trips').update(tripId, formData);
};

export const addCollaborators = (tripId: string, userIds: string[]): Promise<Collaborator> => {
  return pb.collection('trips').update(tripId, {
    'collaborators+': userIds,
  });
};

export const deleteCollaborator = (tripId: string, userId: string): Promise<Collaborator> => {
  return pb.collection('trips').update(tripId, {
    'collaborators-': userId,
  });
};

export const listLodgings = async (tripId: string): Promise<Lodging[]> => {
  const results = await pb.collection('lodgings').getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'startDate',
  });

  // @ts-expect-error type is correct
  return results.items.map((entry) => {
    return {
      ...entry,
      startDate: convertSavedToBrowserDate(entry.startDate),
      endDate: convertSavedToBrowserDate(entry.endDate),
    };
  });
};

export const createLodgingEntry = (payload: CreateLodging): Promise<Lodging> => {
  return pb.collection('lodgings').create(payload);
};

export const updateLodgingEntry = (lodgingId: string, payload: CreateLodging): Promise<Lodging> => {
  return pb.collection('lodgings').update(lodgingId, payload);
};

export const deleteLodging = (lodgingId: string) => {
  return pb.collection('lodgings').delete(lodgingId);
};

export const saveLodgingAttachments = (lodgingId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('attachments', f));
  return pb.collection('lodgings').update(lodgingId, formData);
};

export const loadEverything = (tripId: string) => {
  return import('pdfjs-dist/build/pdf.worker.mjs?url')
    .then((pdfjsWorker) => {
      return fetch(pdfjsWorker.default);
    })
    .then(() => {
      return getTrip(tripId);
    })
    .then(() => {
      return listTransportations(tripId);
    })
    .then((transportations) => {
      transportations.forEach((tr) => {
        tr.attachments?.forEach((attachment) => {
          const attachmentUrl = getAttachmentUrl(tr, attachment);
          fetch(attachmentUrl).then(() => {
            console.log('Attachment ', attachment, ' downloaded');
          });
        });
      });
    })
    .then(() => {
      return listLodgings(tripId);
    })
    .then((lodgings) => {
      lodgings.forEach((l) => {
        l.attachments?.forEach((attachment) => {
          const attachmentUrl = getAttachmentUrl(l, attachment);
          fetch(attachmentUrl).then(() => {
            console.log('Attachment ', attachment, ' downloaded');
          });
        });
      });
    })
    .then(() => {
      return listActivities(tripId);
    })
    .then((activities) => {
      activities.forEach((l) => {
        l.attachments?.forEach((attachment) => {
          const attachmentUrl = getAttachmentUrl(l, attachment);
          fetch(attachmentUrl).then(() => {
            console.log('Attachment ', attachment, ' downloaded');
          });
        });
      });
    });
};

export const exportTripData = async (tripId: string) => {
  return await pb.send('/export-trip', {
    method: 'POST',
    body: { tripId },
  });
};

export const importTripData = async (file: File) => {
  const formData = new FormData();
  formData.append('tripData', file);
  return await pb.send('/import-trip', {
    method: 'POST',
    body: formData,
  });
};
