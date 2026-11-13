import { pb, pbAdmin } from '@src/lib/api/pocketbase/pocketbase';

import type { Notification, Announcement } from '@src/types/notifications';

export const listNotifications = async () => {
  return await pb.collection('notifications').getFullList<Notification>({
    sort: '-created',
  });
};

export const markNotificationAsRead = async (id: string) => {
  return await pb.collection('notifications').update(id, {
    read: true,
  });
};

export const createAnnouncement = async (announcement: Partial<Announcement>) => {
  return await pbAdmin.collection('announcements').create(announcement);
};

export const listAnnouncements = async () => {
  return await pb.collection('announcements').getFullList<Announcement>({
    sort: '-created',
  });
};
