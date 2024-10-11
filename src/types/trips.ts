import {User} from "./auth.ts";

export type Participant = {
  name: string,
  email?: string,
  userId?: string
}

export type Destination = {
  name: string,
  category?: string,
}

export type Trip = {
  id: string,
  ownerId: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate: Date,
  coverImage?: string
  participants?: Participant[]
  destinations?: Destination[]
  collaborators?: User[]
}

export type NewTrip = Omit<Trip, 'id'>
// pocketbase returns date as string

export type TripResponse = Omit<Trip, 'startDate' | 'endDate'> &
  {
    startDate: string,
    endDate: string,
    expand: object
  }

export type CreateTripForm = {
  name: string,
  description?: string,
  dateRange: [Date | null, Date | null],
  coverImage?: string
  participants?: string[]
  destinations?: string[]
}

export type Cost = {
  value: number,
  currency: string
};

export type Transportation = {
  id: string,
  type: string,
  origin: string,
  destination: string,
  cost: Cost,
  departureTime: Date,
  arrivalTime: Date,
  trip: string,
  metadata: { [key: string]: any }
  attachments?: string[]
}

export type CreateTransportation = Omit<Transportation, 'id'>;

export type CarRentalFormSchema = {
  rentalCompany?: string,
  pickupLocation?: string,
  dropOffLocation?: string,
  pickupTime?: Date,
  dropOffTime?: Date,
  confirmationCode?: string,
  cost?: number,
  currencyCode: string,
}

export type TransportationFormSchema = {
  provider?: string,
  origin?: string,
  destination?: string,
  departureTime?: Date,
  arrivalTime?: Date,
  reservation?: string,
  cost?: number,
  currencyCode: string,
}

export type CroppedImage = { height: number, width: number, x: number, y: number }


export type Collaborator = {
  id?: string,
  trip: string,
  user: string | User
}

export type Lodging = {
  id: string,
  type: string,
  name: string,
  address?: string,
  cost?: Cost,
  startDate: Date,
  endDate: Date,
  trip: string,
  confirmationCode?: string,
  metadata?: { [key: string]: any }
  attachments?: string[]
}

export type CreateLodging = Omit<Lodging, 'id'>;


export type LodgingFormSchema = {
  type?: string,
  name?: string,
  address?: string,
  cost?: number,
  currencyCode: string,
  startDate?: Date,
  endDate?: Date,
  confirmationCode? : string
}