export {
  authWithUsernameAndPassword,
  currentUser,
  logoutCurrentUser,
  createUserWithPassword,
  isAdmin,
  getUserByEmail,
  listAllUsers,
  authRefresh,
  updateUserAvatar,
  updateUser,
} from './pocketbase/auth';
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
  deleteTrip,
  addCollaborators,
  deleteCollaborator,
  listLodgings,
  createLodgingEntry,
  saveLodgingAttachments,
  updateLodgingEntry,
  deleteLodging,
  loadEverything,
} from './pocketbase/trips';

export {
  listActivities,
  createActivityEntry,
  saveActivityAttachments,
  updateActivityEntry,
  deleteActivity,
} from './pocketbase/activities';

export { countCities, countAirports } from './pocketbase/lists';

export const formatDate = (locale: string, input: Date) => {
  return input.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
