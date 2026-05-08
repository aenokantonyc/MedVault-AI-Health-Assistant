export type AccountType = 'basic' | 'premium';

export type AppUser = {
  id: string;
  email: string;
  accountType: AccountType;
};
