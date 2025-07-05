import { User } from './auth.ts';
import { RecordModel } from 'pocketbase';

export type Participant = {
  name: string;
  email?: string;
  userId?: string;
};

export type Place = {
  id: string;
  stateName?: string;
  countryName?: string;
  latitude?: string;
  longitude?: string;
  name: string;
  category?: string;
  timezone?: string;
};

export type Trip = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  notes?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  participants?: Participant[];
  destinations?: Place[];
  collaborators?: User[];
};

export type NewTrip = Omit<Trip, 'id'>;
// pocketbase returns date as string

export type TripResponse = Omit<Trip, 'startDate' | 'endDate'> & {
  startDate: string;
  endDate: string;
  expand: object;
};

export type CreateTripForm = {
  name: string;
  description?: string;
  dateRange: [string | null, string | null];
  coverImage?: string;
  participants?: string[];
  destinations?: Place[];
};

export type Cost = {
  value: number;
  currency: string;
};

export type Attachment = {
  id: string;
  name: string;
  file: string;
};

export type Transportation = {
  id: string;
  type: string;
  origin: string;
  destination: string;
  cost: Cost;
  departureTime: string;
  arrivalTime: string;
  trip: string;
  metadata: { [key: string]: any };
  attachments?: string[];
  attachmentReferences?: string[];
};

export type CreateTransportation = {
  type: string;
  origin: string;
  destination: string;
  cost?: Cost;
  departureTime: string;
  arrivalTime: string;
  trip: string;
  metadata?: { [key: string]: any };
  attachments?: string[];
  attachmentReferences?: string[];
};

export type CarRentalFormSchema = {
  rentalCompany?: string;
  pickupLocation?: string;
  dropOffLocation?: string;
  pickupTime?: string;
  dropOffTime?: string;
  confirmationCode?: string;
  cost?: number;
  currencyCode?: string;
};

export type TransportationFormSchema = {
  provider?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  reservation?: string;
  cost?: number;
  currencyCode?: string;
  originAddress?: string;
  destinationAddress?: string;
  flightNumber?: string;
  assignedSeats?: string;
};

export type CroppedImage = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type Collaborator = {
  id?: string;
  trip: string;
  user: string | User;
};

export type Lodging = {
  id: string;
  type: string;
  name: string;
  address?: string;
  cost?: Cost;
  startDate: string;
  endDate: string;
  trip: string;
  confirmationCode?: string;
  metadata?: { [key: string]: any };
  attachments?: string[];
  attachmentReferences?: string[];
};

export type CreateLodging = Omit<Lodging, 'id'>;

export type LodgingFormSchema = {
  type?: string;
  name?: string;
  address?: string;
  cost?: number;
  currencyCode?: string;
  startDate?: string;
  endDate?: string;
  confirmationCode?: string;
  place?: Place;
};

export const enum LodgingType {
  HOTEL = 'hotel',
  HOME = 'home',
  RENTAL = 'vacation_rental',
  CAMP_SITE = 'camp_site',
}

export interface Activity extends RecordModel {
  id: string;
  name: string;
  description: string;
  address?: string;
  startDate: string;
  cost?: Cost;
  trip: string;
  attachments?: string[];
  attachmentReferences?: string[];
}

export type CreateActivity = Omit<Activity, 'id'>;

export type ActivityFormSchema = {
  name?: string;
  description?: string;
  address?: string;
  cost?: number;
  currencyCode?: string;
  startDate?: string;
};

export interface Airport extends Omit<RecordModel, 'collectionName,collectionId'> {
  iataCode?: string;
  name: string;
}

export interface Airline extends Omit<RecordModel, 'collectionName,collectionId'> {
  code?: string;
  logo?: string;
  name: string;
}

export type ItineraryLine = (Transportation | Lodging | Activity) & {
  itineraryType?: string;
};
