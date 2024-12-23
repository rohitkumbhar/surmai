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
} from '../../types/trips.ts';
import { listActivities } from './activities.ts';
import { convertSavedToBrowserDate, downloadAsBase64 } from '../../components/trip/common/util.ts';

export const createTrip = async (data: NewTrip) => {
  return await pb.collection('trips').create(data);
};

export const getTrip = (tripId: string): Promise<Trip> => {
  return pb
    .collection('trips')
    .getOne<TripResponse>(tripId, { expand: 'collaborators' })
    .then((trip) => {
      const { expand, startDate, endDate, ...rest } = trip;
      return {
        ...rest,
        ...expand,
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

export const updateTrip = (tripId: string, data: { [key: string]: any }) => {
  return pb.collection('trips').update(tripId, data);
};

export const listTransportations = async (tripId: string): Promise<Transportation[]> => {
  const results = await pb.collection('transportations').getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'departureTime',
  });

  // @ts-expect-error type is correct
  return results.items.map((entry) => {

    console.log("fff => ", entry);

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

type ExportedTrip = Trip & { coverImageData: string | ArrayBuffer | null };
type ExportedTransportation = Transportation & { attachmentData: object };

export const exportTripData = async (tripId: string) => {
  // trip
  const trip = (await getTrip(tripId)) as ExportedTrip;
  if (trip.coverImage) {
    const coverImageUrl = getAttachmentUrl(trip, trip.coverImage);
    trip.coverImageData = await downloadAsBase64(coverImageUrl);
  }

  // transportations
  const transportations = await listTransportations(tripId);

  const exportedTransportations: ExportedTransportation[] = [];
  transportations.forEach((tr) => {
    const exportedAttachments: { [key: string]: string | ArrayBuffer | null } = {};
    tr.attachments?.forEach(async (attachment) => {
      const attachmentUrl = getAttachmentUrl(tr, attachment);
      exportedAttachments[attachment] = await downloadAsBase64(attachmentUrl);
    });
    exportedTransportations.push({
      ...tr,
      attachmentData: exportedAttachments,
    });
  });

  return { trip: trip, transportations: exportedTransportations };

  /*let lodgings: Lodging[] = await listLodgings(tripId);
  lodgings.forEach((l) => {
    l.attachments?.forEach((attachment) => {
      const attachmentUrl = getAttachmentUrl(l, attachment);
      fetch(attachmentUrl).then(() => {
        console.log('Attachment ', attachment, ' downloaded');
      });
    });
  });
  let activities: Activity[] = await listActivities(tripId);
  activities.forEach((l) => {
    l.attachments?.forEach((attachment) => {
      const attachmentUrl = getAttachmentUrl(l, attachment);
      fetch(attachmentUrl).then(() => {
        console.log('Attachment ', attachment, ' downloaded');
      });
    });
  });*/
};
