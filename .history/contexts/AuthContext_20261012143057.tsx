import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Organizer } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  isUserLoggedIn: boolean;
  userEmail: string | null;
  userPin: string | null;
  loggedInOrganizer: Organizer | null;
  loginUser: (email: string, pin: string) => void;
  logoutUser: () => void;
  loginOrganizer: (username: string, secretId: string) => Promise<boolean>;
  logoutOrganizer: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Public organizer metadata for display on Event cards and Tickets (no secret IDs exposed)
export const ORGANIZERS: Organizer[] = [
  { id: 'super-admin', username: 'Dhakshin', name: 'QrGo Platform', logoUrl: 'https://i.postimg.cc/zf6Twfjr/Qr-Go-Logo.png', secretId: '
    ' },
  { id: 'org-1', username: 'TCA', name: 'TCA IIT Ropar', logoUrl: 'https://i.postimg.cc/02kPf0r8/TCA-Logo.jpg', secretId: '' },
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
  
  const loginOrganizer = useCallback(async (username: string, secretId: string): Promise<boolean> => {
    const cleanUsername = username.trim();
    const cleanSecretId = secretId.trim();

    try {
      console.log(`[Auth] Checking Supabase organizers table for: ${cleanUsername}...`);
      const { data, error } = await supabase
        .from('organizers')
        .select('id, username, name, logoUrl, password')
        .ilike('username', cleanUsername)
        .eq('password', cleanSecretId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Supabase organizers query error:', error.message);
      } else if (data) {
        console.log('[Auth] Successfully authenticated organizer via Supabase:', data.username);
        const org: Organizer = {
          id: data.id,
          username: data.username,
          name: data.name,
          logoUrl: data.logoUrl || 'https://i.postimg.cc/zf6Twfjr/Qr-Go-Logo.png',
          secretId: data.password,
        };
        setLoggedInOrganizer(org);
        return true;
      }
    } catch (err) {
      console.error('[Auth] Error querying Supabase organizers table:', err);
    }

    // Fallback: check hardcoded credentials if Supabase table is unreachable or during transition
    const hardcodedFallback: Record<string, string> = {
      'dhakshin': 'Dk07',
      'tca': 'Tca@7521',
    };
    if (hardcodedFallback[cleanUsername.toLowerCase()] === cleanSecretId) {
      console.log('[Auth] Authenticated via fallback credentials.');
      const localOrg = ORGANIZERS.find(o => o.username.toLowerCase() === cleanUsername.toLowerCase());
      if (localOrg) {
        setLoggedInOrganizer({ ...localOrg, secretId: cleanSecretId });
        return true;
      }
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