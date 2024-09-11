export {authWithUsernameAndPassword, currentUser, logoutCurrentUser, createUserWithPassword} from './pocketbase/auth'
export {getTrip, listTrips, createTrip} from './pocketbase/trips'


export const formatDate = (input: string) => {
  return new Date(Date.parse(input.toString())).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}