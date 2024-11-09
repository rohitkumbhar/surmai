export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string
};

export type SignUpForm = {
  email: string;
  fullName: string;
  password: string;
};
