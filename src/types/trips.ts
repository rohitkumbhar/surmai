export type Participant = {
  name: string,
  userId?: string,
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
}

export type NewTrip = Omit<Trip, 'id'>
// pocketbase returns date as string
export type TripResponse = Omit<Trip, 'startDate' | 'endDate'> & { startDate: string, endDate: string }

export type CreateTripForm = {
  name: string,
  description?: string,
  dateRange: [Date | null, Date | null],
  coverImage?: string
  participants?: string[]
  destinations?: string[]
}

export type Transportation = {
  id: string,
  type: string,
  origin: string,
  destination: string,
  cost: {
    value: number,
    currency: string
  },
  departureTime: Date,
  arrivalTime: Date,
  trip: string,
  metadata: { [key: string]: any }
  attachments: string[]
}