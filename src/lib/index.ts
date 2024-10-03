export {
  authWithUsernameAndPassword, currentUser, logoutCurrentUser, createUserWithPassword, isAdmin, getUserByEmail
} from './pocketbase/auth'
export {
  getTrip,
  listTrips,
  createTrip,
  getAttachmentUrl,
  saveTransportationAttachments,
  addFlight,
  deleteTransportation,
  deleteTransportationAttachment,
  listTransportations,
  updateTrip,
  createTransportationEntry,
  uploadTripCoverImage,
  deleteTrip
} from './pocketbase/trips'


export const formatDate = (locale: string, input: Date) => {
  return input.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}