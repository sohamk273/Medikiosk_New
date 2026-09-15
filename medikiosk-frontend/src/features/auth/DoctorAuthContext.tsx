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
  isLoading: boolean;
  login: (username: string, password: string) => Promise<DoctorUser>;
  logout: () => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export function DoctorAuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoctorUser | null>(() => DoctorAuthProvider.getUser());
  const [token, setToken] = useState<string | null>(() => DoctorAuthProvider.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(DoctorAuthProvider.getToken()));

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = DoctorAuthProvider.getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await DoctorAuthProvider.validateSession();
        if (isMounted) {
          if (verifiedUser) {
            setUser(verifiedUser);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    // Sync state if localStorage changes across tabs
    const handleStorageChange = () => {
      setUser(DoctorAuthProvider.getUser());
      setToken(DoctorAuthProvider.getToken());
    };

    // Handle centralized auth expired event
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('medikiosk:auth-expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('medikiosk:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (username: string, password: string): Promise<DoctorUser> => {
    setIsLoading(true);
    try {
      const loggedInUser = await DoctorAuthProvider.login(username, password);
      setUser(loggedInUser);
      setToken(DoctorAuthProvider.getToken());
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    DoctorAuthProvider.logout();
    setUser(null);
    setToken(null);
    setIsLoading(false);
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <DoctorAuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
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
