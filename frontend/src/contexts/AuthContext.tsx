import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on application load
  const checkSession = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getMe();
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // Unauthenticated or network error on startup
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res?.user) {
      setUser(res.user);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    await authService.signup(name, email, password);
    // Explicitly clear session so newly registered user is prompted to sign in
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
