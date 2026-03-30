import { createContext, useState, ReactNode } from "react";

type UserType = {
  id: string;
  email: string;
  accountType: "basic" | "premium";
} | null;

type AuthContextType = {
  user: UserType;
  accountType: "basic" | "premium" | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: { message: string } | null }>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);

  // ⭐ THIS IS THE IMPORTANT FUNCTION
  const signIn = async (email: string, password: string) => {
    // fake loading delay (looks real in demo)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // PREMIUM ACCOUNT (unlocks AI analysis paywall)
    if (email === "premiumuser@gmail.com" && password === "123456789") {
      setUser({ id: "premium-user-001", email, accountType: "premium" });
      return { error: null };
    }

    // BASIC ACCOUNT (locked features)
    if (email === "normaluser@gmail.com" && password === "123456789") {
      setUser({ id: "basic-user-001", email, accountType: "basic" });
      return { error: null };
    }

    // WRONG LOGIN
    return {
      error: { message: "Invalid email or password" },
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
        signIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};