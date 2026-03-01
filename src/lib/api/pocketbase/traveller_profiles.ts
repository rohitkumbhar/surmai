import { pb } from './pocketbase.ts';

import type { NewTravellerProfile, TravellerProfile, TravellerProfileManager } from '../../../types/trips.ts';

const collection = pb.collection('traveller_profiles');

// List endpoints return managers as IDs with an expand sidecar.
// Normalise each profile so that managers always contains enriched objects.
const normalizeManagers = (p: any): TravellerProfile => {
  if (Array.isArray(p.expand?.managers)) {
    p.managers = p.expand.managers as TravellerProfileManager[];
  } else {
    p.managers = [];
  }
  return p as TravellerProfile;
};

export const createTravellerProfile = async (data: Partial<NewTravellerProfile>) => {
  return (await collection.create(data)) as TravellerProfile;
};

export const getTravellerProfile = (id: string): Promise<TravellerProfile> => {
  // The OnRecordViewRequest hook enriches managers in-place; no expand needed.
  return collection.getOne<TravellerProfile>(id);
};

export const getMyTravellerProfile = async (email: string): Promise<TravellerProfile | null> => {
  try {
    const raw = await collection.getFirstListItem<any>(`email = "${email}"`, { expand: 'managers' });
    return normalizeManagers(raw);
  } catch {
    return null;
  }
};

export const upsertMyTravellerProfile = async (
  email: string,
  ownerId: string,
  data: Partial<NewTravellerProfile>,
  files: File[]
): Promise<TravellerProfile> => {
  let existing: TravellerProfile | null = null;
  try {
    existing = await collection.getFirstListItem<TravellerProfile>(`email = "${email}"`);
  } catch {
    // not found
  }

  let profile: TravellerProfile;
  if (existing) {
    await collection.update(existing.id, data);
    profile = await collection.getOne<TravellerProfile>(existing.id);
  } else {
    profile = (await collection.create({ ...data, email, ownerId })) as TravellerProfile;
  }

  if (files.length > 0) {
    const formData = new FormData();
    files.forEach((file) => formData.append('attachments', file));
    await collection.update(profile.id, formData);
    profile = await collection.getOne<TravellerProfile>(profile.id);
  }

  return profile;
};

export const listTravellerProfiles = async (): Promise<TravellerProfile[]> => {
  const raw = await collection.getFullList<any>({ sort: '-created', expand: 'managers' });
  return raw.map(normalizeManagers);
};

export const listOtherTravellerProfiles = async (excludeEmail: string): Promise<TravellerProfile[]> => {
  return (
    await collection.getFullList<TravellerProfile>({
      sort: '-created',
      filter: `email != "${excludeEmail}"`,
    })
  ).map(normalizeManagers);
};

export const updateTravellerProfile = (id: string, data: Partial<TravellerProfile>) => {
  return collection.update(id, data);
};

export const deleteTravellerProfile = (id: string) => {
  return collection.delete(id);
};

export const uploadTravellerAttachments = (id: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('attachments', file);
  });
  return collection.update(id, formData);
};
