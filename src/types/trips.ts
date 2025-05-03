import { User } from './auth.ts';
import { RecordModel } from 'pocketbase';

export type Participant = {
  name: string;
  email?: string;
  userId?: string;
};

export type Destination = {
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
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  participants?: Participant[];
  destinations?: Destination[];
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
  dateRange: [Date | null, Date | null];
  coverImage?: string;
  participants?: string[];
  destinations?: Destination[];
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
  departureTime: Date;
  arrivalTime: Date;
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
  pickupTime?: Date;
  dropOffTime?: Date;
  confirmationCode?: string;
  cost?: number;
  currencyCode?: string;
};

export type TransportationFormSchema = {
  provider?: string;
  origin?: string;
  destination?: string;
  departureTime?: Date;
  arrivalTime?: Date;
  reservation?: string;
  cost?: number;
  currencyCode?: string;
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
  startDate: Date;
  endDate: Date;
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
  startDate?: Date;
  endDate?: Date;
  confirmationCode?: string;
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
  startDate: Date;
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
  startDate?: Date;
};

export interface Airport extends RecordModel {
  iataCode?: string;
  name: string;
}

export interface Airline extends RecordModel {
  code?: string;
  logo?: string;
  name: string;
}

export type ItineraryLine = (Transportation | Lodging | Activity) & {
  itineraryType?: string;
};
