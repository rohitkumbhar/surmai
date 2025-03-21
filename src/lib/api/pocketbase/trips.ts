import { pb } from './pocketbase.ts';
import { Activity, Collaborator, Lodging, NewTrip, Transportation, Trip, TripResponse } from '../../../types/trips.ts';
import { listActivities } from './activities.ts';
import { User } from '../../../types/auth.ts';
import { listTransportations } from './transportations.ts';
import { listLodgings } from './lodgings.ts';

const trips = pb.collection('trips');

export const createTrip = async (data: NewTrip) => {
  return (await trips.create(data)) as Trip;
};

export const getTrip = (tripId: string): Promise<Trip> => {
  return trips.getOne<TripResponse>(tripId).then((trip) => {
    const { startDate, endDate, ...rest } = trip;
    return {
      ...rest,
      startDate: new Date(Date.parse(startDate)),
      endDate: new Date(Date.parse(endDate)),
    };
  });
};

export const listTrips = async (): Promise<Trip[]> => {
  const results = await trips.getFullList<TripResponse>({
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

export const listUpcomingTrips = async (): Promise<Trip[]> => {
  const results = await trips.getFullList<TripResponse>({
    sort: 'startDate',
    filter: `endDate > "${new Date().toISOString()}"`,
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

export const listPastTrips = async (): Promise<Trip[]> => {
  const results = await trips.getFullList<TripResponse>({
    sort: '-endDate',
    filter: `endDate < "${new Date().toISOString()}"`,
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
  return pb.send(`/api/surmai/trip/${tripId}/collaborators`, {
    method: 'GET',
  });
};

export const updateTrip = (tripId: string, data: Trip) => {
  return trips.update(tripId, data);
};

export const deleteTrip = (tripId: string) => {
  return trips.delete(tripId);
};

export const getAttachmentUrl = (record: Trip | Transportation | Lodging | Activity | User, fileName: string) => {
  return pb.files.getURL(record, fileName);
};

export const uploadTripCoverImage = (tripId: string, coverImage: File | Blob) => {
  const formData = new FormData();
  formData.append('coverImage', coverImage);
  return trips.update(tripId, formData);
};

export const addCollaborators = (tripId: string, userIds: string[]): Promise<Collaborator> => {
  return trips.update(tripId, {
    'collaborators+': userIds,
  });
};

export const deleteCollaborator = (tripId: string, userId: string): Promise<Collaborator> => {
  return trips.update(tripId, {
    'collaborators-': userId,
  });
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
  return await pb.send(`/api/surmai/trip/${tripId}/export`, {
    method: 'POST',
  });
};

export const importTripData = async (file: File) => {
  const formData = new FormData();
  formData.append('tripData', file);
  return await pb.send(`/api/surmai/trip/import`, {
    method: 'POST',
    body: formData,
  });
};
