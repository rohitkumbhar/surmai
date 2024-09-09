export type Trip = {
  id?: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate?: Date
  coverImage?: string
  participants? : string[]
  destinations?: string[]
}