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
  watchUserChanges,
} from '@src/lib/api/pocketbase/auth.ts';

export {
  getTrip,
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
  listAllTrips,
  listTripsByYear,
  saveTripNotes,
  exportCalendar,
} from '@src/lib/api/pocketbase/trips.ts';

export {
  listActivities,
  listActivitiesByYear,
  createActivityEntry,
  updateActivityEntry,
  deleteActivity,
  saveActivityAttachments,
  deleteActivityAttachments,
} from '@src/lib/api/pocketbase/activities.ts';

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
  getCurrencyConversionRates,
} from '@src/lib/api/pocketbase/lists.ts';

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
  disablePasswordAuth,
  enablePasswordAuth,
  disableOAuth2Provider,
  sendUserAccountInvitation,
  getSettingsForKey,
  setSettingsForKey,
} from '@src/lib/api/pocketbase/settings.ts';

export { sendCollaborationInvitation, listInvitations, invitationAction } from '@src/lib/api/pocketbase/invitations.ts';

export { pocketBaseUrl as apiUrl } from '@src/lib/api/pocketbase/pocketbase.ts';
export {
  listTransportations,
  listTransportationsByYear,
  createTransportationEntry,
  saveTransportationAttachments,
  deleteTransportation,
  deleteTransportationAttachment,
} from '@src/lib/api/pocketbase/transportations.ts';

export {
  deleteLodging,
  updateLodgingEntry,
  createLodgingEntry,
  saveLodgingAttachments,
  listLodgings,
  listLodgingsByYear,
  deleteLodgingAttachments,
} from '@src/lib/api/pocketbase/lodgings.ts';

export { getTripAttachments, deleteAttachment, uploadAttachments, getHtmlFile } from '@src/lib/api/pocketbase/attachments.ts';

export {
  listExpenses,
  listExpensesByYear,
  createExpense,
  updateExpense,
  deleteExpense,
  addAttachmentsToExpense,
} from '@src/lib/api/pocketbase/expenses.ts';

export { getFlightRoute, type FlightRoute } from '@src/lib/api/pocketbase/flights.ts';

export {
  saveTransportation,
  saveLodging,
  saveActivity,
  type SaveEntityPayload,
  type SaveEntityExpense,
} from '@src/lib/api/pocketbase/save_entity.ts';

export {
  createTravellerProfile,
  getTravellerProfile,
  getMyTravellerProfile,
  upsertMyTravellerProfile,
  listTravellerProfiles,
  listTripTravellerProfiles,
  listOtherTravellerProfiles,
  updateTravellerProfile,
  deleteTravellerProfile,
  uploadTravellerAttachments,
} from '@src/lib/api/pocketbase/traveller_profiles.ts';

export {
  listNotifications,
  markNotificationAsRead,
  createAnnouncement,
  listAnnouncements,
} from '@src/lib/api/pocketbase/notifications.ts';

export * from '@src/lib/api/pocketbase/assistant.ts';
