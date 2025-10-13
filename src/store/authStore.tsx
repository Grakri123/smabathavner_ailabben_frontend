import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Handle auth callback from magic link
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Handling auth callback...');
        console.log('📍 Current URL:', window.location.href);
        
        // Check if we have query parameters (magic link tokens)
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        
        if (accessToken || error) {
          console.log('🔍 Found query parameters, processing...');
          
          if (error) {
            console.error('❌ Auth error in query:', error);
            setState(prev => ({ ...prev, loading: false }));
            return;
          }
          
          if (accessToken && refreshToken) {
            console.log('✅ Tokens found in query, setting session...');
            
            // Set the session manually
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError);
            } else if (sessionData.session) {
              console.log('✅ Session set successfully:', sessionData.session.user?.email);
              setState({
                user: sessionData.session.user,
                session: sessionData.session,
                loading: false,
                isAuthenticated: true,
              });
              
              // Clear the query parameters from URL
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
        }
        
        // Fallback: check hash parameters (in case Supabase still uses them)
        if (window.location.hash.includes('access_token')) {
          console.log('🔍 Found hash parameters as fallback, processing...');
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashAccessToken = hashParams.get('access_token');
          const hashRefreshToken = hashParams.get('refresh_token');
          const hashError = hashParams.get('error');
          
          if (hashError) {
            console.error('❌ Auth error in hash:', hashError);
            setState(prev => ({ ...prev, loading: false }));
            return;
          }
          
          if (hashAccessToken && hashRefreshToken) {
            console.log('✅ Tokens found in hash, setting session...');
            
            const { data: hashSessionData, error: hashSessionError } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });
            
            if (hashSessionError) {
              console.error('❌ Error setting session:', hashSessionError);
            } else if (hashSessionData.session) {
              console.log('✅ Session set successfully:', hashSessionData.session.user?.email);
              setState({
                user: hashSessionData.session.user,
                session: hashSessionData.session,
                loading: false,
                isAuthenticated: true,
              });
              
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
        }
        
        // Fallback: try to get existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
        } else if (sessionData.session) {
          console.log('✅ Existing session found:', sessionData.session.user?.email);
          setState({
            user: sessionData.session.user,
            session: sessionData.session,
            loading: false,
            isAuthenticated: true,
          });
          return;
        }
        
        // No session found
        setState(prev => ({ ...prev, loading: false }));
      } catch (callbackError) {
        console.error('Error handling auth callback:', callbackError);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    // Check if we're on auth callback page
    if (window.location.pathname === '/auth/callback') {
      console.log('🔄 Handling auth callback...');
      handleAuthCallback();
      return;
    }

    // Get initial session for other pages
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: initError } = await supabase.auth.getSession();
        
        if (initError) {
          console.error('Error getting initial session:', initError);
        } else {
          setState({
            user: session?.user ?? null,
            session,
            loading: false,
            isAuthenticated: !!session?.user,
          });
        }
      } catch (initError) {
        console.error('Error initializing auth:', initError);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session?.user,
        });

        // Handle session persistence for "remember me"
        if (event === 'SIGNED_IN' && session) {
          // Session is automatically persisted by Supabase
          console.log('User signed in:', session.user.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Sign out error:', signOutError);
      } else {
        console.log('Successfully signed out');
      }
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signInWithMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Only allow system@ailabben.no
      if (email !== 'system@ailabben.no') {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Denne e-posten har ikke tilgang til applikasjonen.' };
      }

      console.log('🔗 Sending magic link to:', email);

      // Use popup-based authentication to avoid double redirect
      const { data, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false, // Don't create new users
        },
      });
      
      console.log('🔗 Magic link sent with redirect URL:', `${window.location.origin}/auth/callback`);

      if (magicLinkError) {
        console.error('❌ Magic link error:', magicLinkError);
        setState(prev => ({ ...prev, loading: false }));
        
        let errorMessage = 'Kunne ikke sende magic link.';
        if (magicLinkError.message.includes('Invalid email')) {
          errorMessage = 'Ugyldig e-postadresse.';
        } else if (magicLinkError.message.includes('Too many requests') || magicLinkError.message.includes('For security purposes')) {
          const match = magicLinkError.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          errorMessage = `For mange forsøk. Vent ${seconds} sekunder før du prøver igjen.`;
        } else if (magicLinkError.message.includes('Email not confirmed')) {
          errorMessage = 'E-posten er ikke bekreftet.';
        } else if (magicLinkError.message.includes('User not found')) {
          errorMessage = 'Bruker ikke funnet.';
        }
        
        return { success: false, error: errorMessage };
      }

      console.log('✅ Magic link sent successfully to:', email);
      setState(prev => ({ ...prev, loading: false }));
      const result = { success: true };
      console.log('🔍 AuthStore returning result:', result);
      return result;
    } catch (magicLinkCatchError) {
      console.error('❌ Magic link catch error:', magicLinkCatchError);
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'En uventet feil oppstod. Prøv igjen.' };
    }
  };

  const value: AuthContextType = {
    ...state,
    signInWithMagicLink,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
