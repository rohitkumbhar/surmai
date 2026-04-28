export type Notification = {
  id: string;
  created: string;
  updated: string;
  userId: string;
  subject: string;
  text: string;
  message: string;
  expiry: string;
  sender: string;
  read: boolean;
};

export type Announcement = {
  id: string;
  created: string;
  updated: string;
  subject: string;
  text: string;
  message: string;
  expiry: string;
  sender: string;
};
