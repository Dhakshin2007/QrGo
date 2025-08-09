import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ADMIN_PASSWORD } from '../constants';

interface AuthState {
  isUserLoggedIn: boolean;
  userEmail: string | null;
  userPin: string | null;
  isAdminLoggedIn: boolean;
  loginUser: (email: string, pin: string) => void;
  logoutUser: () => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPin, setUserPin] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const loginUser = (email: string, pin:string) => {
    setUserEmail(email.toLowerCase());
    setUserPin(pin);
    setIsUserLoggedIn(true);
  };

  const logoutUser = () => {
    setIsUserLoggedIn(false);
    setUserEmail(null);
    setUserPin(null);
  };
  
  const loginAdmin = (password: string): boolean => {
    const isAdmin = password === ADMIN_PASSWORD;
    if (isAdmin) {
        setIsAdminLoggedIn(true);
    }
    return isAdmin;
  };
  
  const logoutAdmin = () => {
      setIsAdminLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isUserLoggedIn, userEmail, userPin, isAdminLoggedIn, loginUser, logoutUser, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
