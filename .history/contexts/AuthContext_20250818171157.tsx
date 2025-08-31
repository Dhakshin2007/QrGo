import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
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

// --- Security Note ---
// In a real production application, this organizer data should NOT be hardcoded here.
// It should be loaded securely, for example, from environment variables on a server
// or from a secure configuration service. This prevents sensitive credentials from
// being exposed in the client-side code.
// Example for a Node.js environment:
// const ORGANIZERS = JSON.parse(process.env.ORGANIZERS_JSON || '[]');
export const ORGANIZERS: Organizer[] = [
  { id: 'super-admin', username: 'Dhakshin', name: 'QrGo Platform', logoUrl: 'https://i.postimg.cc/zf6Twfjr/Qr-Go-Logo.png', secretId: 'Dk07' },
  { id: 'org-1', username: 'TCA', name: 'TCA IIT Ropar', logoUrl: 'https://i.postimg.cc/02kPf0r8/TCA-Logo.jpg', secretId: 'tca@2334' },
  { id: 'org-2', username: '', name: 'Alfaaz IIT Ropar', logoUrl: 'https://i.postimg.cc/d1wN8tB3/Tech-Con.png', secretId: 'Akash7788' }
];


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