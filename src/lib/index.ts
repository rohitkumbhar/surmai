export {authWithUsernameAndPassword, currentUser, logoutCurrentUser, createUserWithPassword, isAdmin} from './pocketbase/auth'
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
  updateTrip
} from './pocketbase/trips'


export const formatDate = (input: string) => {
  return new Date(Date.parse(input.toString())).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}