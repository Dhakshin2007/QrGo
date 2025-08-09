import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ORGANIZERS } from '../constants';
import { Organizer } from '../types';

interface AuthState {
  isUserLoggedIn: boolean;
  userEmail: string | null;
  userPin: string | null;
  loggedInOrganizer: Organizer | null;
  loginUser: (email: string, pin: string) => void;
  logoutUser: () => void;
  loginOrganizer: (username: string, secretId: string) => boolean;
  logoutOrganizer: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPin, setUserPin] = useState<string | null>(null);
  const [loggedInOrganizer, setLoggedInOrganizer] = useState<Organizer | null>(null);

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
  
  const loginOrganizer = useCallback((username: string, secretId: string): boolean => {
    const organizer = ORGANIZERS.find(
        org => org.username.toLowerCase() === username.toLowerCase() && org.secretId === secretId
    );
    if (organizer) {
        setLoggedInOrganizer(organizer);
        return true;
    }
    return false;
  }, []);
  
  const logoutOrganizer = () => {
      setLoggedInOrganizer(null);
  };

  return (
    <AuthContext.Provider value={{ isUserLoggedIn, userEmail, userPin, loggedInOrganizer, loginUser, logoutUser, loginOrganizer, logoutOrganizer }}>
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
