/**
 * React Context providing Doctor Authentication state.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DoctorAuthProvider } from '@/services/auth/DoctorAuthProvider';
import type { DoctorUser } from '@/services/auth/DoctorAuthProvider';

interface DoctorAuthContextType {
  user: DoctorUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<DoctorUser>;
  logout: () => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export function DoctorAuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoctorUser | null>(() => DoctorAuthProvider.getUser());
  const [token, setToken] = useState<string | null>(() => DoctorAuthProvider.getToken());

  useEffect(() => {
    // Sync state if localStorage changes across tabs
    const handleStorageChange = () => {
      setUser(DoctorAuthProvider.getUser());
      setToken(DoctorAuthProvider.getToken());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (username: string, password: string): Promise<DoctorUser> => {
    const loggedInUser = await DoctorAuthProvider.login(username, password);
    setUser(loggedInUser);
    setToken(DoctorAuthProvider.getToken());
    return loggedInUser;
  };

  const logout = () => {
    DoctorAuthProvider.logout();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <DoctorAuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth(): DoctorAuthContextType {
  const context = useContext(DoctorAuthContext);
  if (!context) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthContextProvider');
  }
  return context;
}
