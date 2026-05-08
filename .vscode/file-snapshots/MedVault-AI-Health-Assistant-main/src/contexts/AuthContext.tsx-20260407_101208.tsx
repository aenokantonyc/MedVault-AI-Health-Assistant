import { createContext, useState, ReactNode } from 'react';
import { DEMO_USER_EMAIL, DEMO_USER_ID } from '../lib/demoUser';
import type { AccountType, AppUser } from '../types/auth';

type UserType = AppUser | null;

type AuthContextType = {
  user: UserType;
  accountType: AccountType | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => Promise<{ error: { message: string } | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: { message: string } | null }>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>({
    id: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    accountType: 'premium',
  });
  const [loading] = useState(false);

  const buildUser = (email: string, accountType: AccountType): AppUser => ({
    id: email === DEMO_USER_EMAIL ? DEMO_USER_ID : email,
    email,
    accountType,
  });

  const signUp = async (email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setUser(buildUser(email, 'basic'));
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === 'premiumuser@gmail.com' && password === '123456789') {
      setUser(buildUser(email, 'premium'));
      return { error: null };
    }

    if (email === 'normaluser@gmail.com' && password === '123456789') {
      setUser(buildUser(email, 'basic'));
      return { error: null };
    }

    if (email === DEMO_USER_EMAIL && password === 'demo123456') {
      setUser(buildUser(email, 'premium'));
      return { error: null };
    }

    return {
      error: { message: 'Invalid email or password' },
    };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accountType: user?.accountType ?? null,
        loading,
        signUp,
        signIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};