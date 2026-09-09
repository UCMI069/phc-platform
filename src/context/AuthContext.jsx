import React, { createContext, useContext, useEffect, useState } from 'react';
import { neon as supabase } from '../lib/neon';

const AuthContext = createContext();

// Custom event bus for same-tab auth changes
const authBus = new EventTarget();
export const emitAuthChange = (session) => {
  authBus.dispatchEvent(new CustomEvent('change', { detail: session }));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        setSession(initialSession);

        if (initialSession?.user?.id) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user || initialSession.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for same-tab auth changes
    const handleAuthChange = (e) => {
      const s = e.detail;
      setSession(s);
      setUser(s?.user || null);
      setLoading(false);
    };
    authBus.addEventListener('change', handleAuthChange);

    // Listen for cross-tab auth changes
    const handleStorage = (e) => {
      if (e.key === 'phc_session') {
        const s = e.newValue ? JSON.parse(e.newValue) : null;
        setSession(s);
        setUser(s?.user || null);
        setLoading(false);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      authBus.removeEventListener('change', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
