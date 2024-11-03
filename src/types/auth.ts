export type User = {
  id: string;
  email: string;
  name: string;
  prefs?: { [key: string]: string };
};

export type SignUpForm = {
  email: string;
  fullName: string;
  password: string;
};
