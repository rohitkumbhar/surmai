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