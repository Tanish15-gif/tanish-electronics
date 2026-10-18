import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getStoredAuthUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest
} from "../Services/customAuthService";

type CustomAuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const CustomAuthContext = createContext<CustomAuthContextValue | null>(null);

export function CustomAuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = () => setUser(getStoredAuthUser());
    syncUser();
    setLoading(false);
    window.addEventListener("storage", syncUser);
    window.addEventListener("te-auth-changed", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("te-auth-changed", syncUser);
    };
  }, []);

  const value = useMemo<CustomAuthContextValue>(() => {
    const roles = user?.roles.map((role) => role.toLowerCase()) ?? [];

    return {
      user,
      isAuthenticated: Boolean(user),
      isAdmin: roles.includes("admin") || roles.includes("owner"),
      isCustomer: roles.includes("customer"),
      loading,
      setUser,
      async login(request) {
        const response = await loginUser(request);
        setUser(response.user);
      },
      async register(request) {
        const response = await registerUser(request);
        setUser(response.user);
      },
      async logout() {
        await logoutUser();
        setUser(null);
      }
    };
  }, [user, loading]);

  return (
    <CustomAuthContext.Provider value={value}>
      {children}
    </CustomAuthContext.Provider>
  );
}

export function useCustomAuth() {
  const context = useContext(CustomAuthContext);

  if (!context) {
    throw new Error("useCustomAuth must be used inside CustomAuthProvider.");
  }

  return context;
}
