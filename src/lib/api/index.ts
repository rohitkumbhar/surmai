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
  adminAuthRefresh,
  listAuthMethods,
  startOAuthFlow,
  sendResetPasswordRequest,
} from './pocketbase/auth.ts';

export {
  getTrip,
  listTrips,
  listCollaborators,
  createTrip,
  getAttachmentUrl,
  updateTrip,
  uploadTripCoverImage,
  deleteTrip,
  addCollaborators,
  deleteCollaborator,
  loadEverything,
  exportTripData,
  importTripData,
  listUpcomingTrips,
  listPastTrips,
} from './pocketbase/trips.ts';

export {
  listActivities,
  createActivityEntry,
  saveActivityAttachments,
  updateActivityEntry,
  deleteActivity,
  deleteActivityAttachments,
} from './pocketbase/activities.ts';

export {
  loadCities,
  loadAirports,
  loadAirlines,
  countPlaces,
  countAirports,
  countAirlines,
  searchPlaces,
  searchAirports,
  searchAirlines,
} from './pocketbase/lists.ts';

export {
  getSmtpSettings,
  updateSmtpSettings,
  sendTestEmail,
  getUsersMetadata,
  setOAuth2Provider,
  updateUser,
  updateUserAdminAction,
  deleteUserAdminAction,
  updateAdminUser,
  areSignupsEnabled,
  disableUserSignups,
  enableUserSignups,
  disableOAuth2Provider,
  sendUserAccountInvitation,
} from './pocketbase/settings.ts';

export { sendCollaborationInvitation, listInvitations, invitationAction } from './pocketbase/invitations.ts';

export { pocketBaseUrl as apiUrl } from './pocketbase/pocketbase.ts';
export {
  listTransportations,
  createTransportationEntry,
  saveTransportationAttachments,
  deleteTransportation,
  deleteTransportationAttachment,
} from './pocketbase/transportations.ts';

export {
  deleteLodging,
  updateLodgingEntry,
  createLodgingEntry,
  saveLodgingAttachments,
  listLodgings,
  deleteLodgingAttachments,
} from './pocketbase/lodgings.ts';
