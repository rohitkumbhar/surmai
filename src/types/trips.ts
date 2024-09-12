export type Trip = {
  id: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate: Date
  coverImage?: string
  participants?: string[]
  destinations?: string[]
}

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
  departureTime: Date | string | null,
  arrivalTime: Date | string | null,
  trip: string,
  metadata: { [key: string]: any }
}