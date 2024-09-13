import {pb} from "./pocketbase.ts";
import {NewTrip, Transportation, Trip, TripResponse} from "../../types/trips.ts";

export const createTrip = async (data: NewTrip) => {
  return await pb.collection('trips').create(data);
}

export const getTrip = (tripId: string): Promise<Trip> => {
  return pb.collection('trips').getOne<TripResponse>(tripId)
    .then((trip) => {
      return {
        ...trip,
        startDate: new Date(Date.parse(trip.startDate)),
        endDate: new Date(Date.parse(trip.endDate))
      }
    });
}

export const listTrips = async (): Promise<Trip[]> => {
  const results = await pb.collection('trips').getFullList<TripResponse>({
    sort: '-created',
  });
  return results.map(trip => {
    return {
      ...trip,
      startDate: new Date(Date.parse(trip.startDate)),
      endDate: new Date(Date.parse(trip.endDate))
    };
  });
}

export const updateTrip = (tripId: string, data: { [key: string]: any }) => {
  return pb.collection('trips').update(tripId, data);
}

export const listTransportations = async (tripId: string): Promise<Transportation[]> => {

  const results = await pb.collection('transportations').getList(1, 50, {
    filter: `trip="${tripId}"`,
    sort: 'departureTime',
  });

  // @ts-expect-error type is correct
  return results.items.map((entry) => {
    return {
      ...entry,
      departureTime: new Date(Date.parse(entry.departureTime)),
      arrivalTime: new Date(Date.parse(entry.arrivalTime))
    };
  });
}

export const deleteTransportation = (transportationId: string) => {
  return pb.collection('transportations').delete(transportationId);
}

export const addFlight = (tripId: string, data: { [key: string]: any }): Promise<Transportation> => {
  const payload = {
    type: 'flight',
    origin: data.origin,
    destination: data.destination,
    cost: {
      value: data.cost,
      currency: data.currencyCode
    },
    departureTime: data.departureTime?.toISOString(),
    arrivalTime: data.arrivalTime?.toISOString(),
    trip: tripId,
    metadata: JSON.stringify({
      airline: data.airline,
      flightNumber: data.flightNumber,
      confirmationCode: data.confirmationCode
    })
  }
  return pb.collection('transportations').create(payload);
}

export const saveTransportationAttachments = (transportationId: string, files: File[]) => {
  const formData = new FormData()
  files.forEach(f => formData.append("attachments", f));
  return pb.collection('transportations').update(transportationId, formData);
}

export const getAttachmentUrl = (record: any, fileName: string) => {
  return pb.files.getUrl(record, fileName);
}

export const deleteTransportationAttachment = (transportationId: string, fileName: string) => {
  return pb.collection("transportations").update(transportationId, {
    'attachments-': [fileName]
  })
}