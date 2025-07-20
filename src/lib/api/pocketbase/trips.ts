import { pb } from './pocketbase.ts';
import {
  Activity,
  Attachment,
  Collaborator,
  Lodging,
  NewTrip,
  Transportation,
  Trip,
  TripResponse,
} from '../../../types/trips.ts';
import { listActivities } from './activities.ts';
import { User } from '../../../types/auth.ts';
import { listTransportations } from './transportations.ts';
import { listLodgings } from './lodgings.ts';
import { getTripAttachments } from './attachments.ts';
import dayjs from 'dayjs';

const trips = pb.collection('trips');

export const createTrip = async (data: NewTrip) => {
  return (await trips.create(data)) as Trip;
};

export const getTrip = (tripId: string): Promise<Trip> => {
  return trips.getOne<TripResponse>(tripId).then((trip) => {
    return trip;
  });
};

export const listTrips = async (): Promise<Trip[]> => {
  const results = await trips.getFullList<TripResponse>({
    sort: '-created',
    expand: 'collaborators',
  });
  return results.map((trip) => {
    return trip;
  });
};

export const listUpcomingTrips = async (): Promise<Trip[]> => {
  const threshold = dayjs().format('YYYY-MM-DD');
  const results = await trips.getFullList<TripResponse>({
    sort: 'startDate',
    filter: `endDate >= "${threshold}"`,
  });
  return results.map((trip) => {
    return trip;
  });
};

export const listPastTrips = async (): Promise<Trip[]> => {
  const threshold = dayjs().format('YYYY-MM-DD');
  const results = await trips.getFullList<TripResponse>({
    sort: '-endDate',
    filter: `endDate < "${threshold}"`,
  });
  return results.map((trip) => {
    return trip;
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

export const getAttachmentUrl = (
  record: Trip | Transportation | Lodging | Activity | User | Attachment,
  fileName: string,
  options?: { [key: string]: string }
) => {
  return pb.files.getURL(record, fileName, options);
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

export const saveTripNotes = (tripId: string, notes: string): Promise<Trip> => {
  return trips.update(tripId, {
    notes: notes,
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
      return getTripAttachments(tripId);
    })
    .then((attachments) => {
      attachments.forEach((attachment) => {
        const attachmentUrl = getAttachmentUrl(attachment, attachment.file);
        fetch(attachmentUrl).then(() => {
          console.log('Attachment ', attachment, ' downloaded');
        });
      });
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
  return pb
    .send(`/api/surmai/trip/${tripId}/export`, {
      method: 'POST',
    })
    .then((response) => {
      return Uint8Array.from(atob(response.data), (c) => c.charCodeAt(0));
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

export const exportCalendar = ({ tripId }: { tripId: string }) => {
  return pb
    .send(`/api/surmai/trip/${tripId}/calendar`, {
      method: 'POST',
    })
    .then((response) => {
      return response;
    });
};
