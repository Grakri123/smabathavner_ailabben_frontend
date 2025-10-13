import React, { useEffect, useState } from 'react';
import { useAuth } from '../../store/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = () => {
      console.log('🔄 AuthCallback component mounted');
      console.log('📍 Current URL:', window.location.href);
      console.log('🪟 Window opener:', !!window.opener);
      
      // Check if we have query parameters or hash parameters
      const hasQueryParams = window.location.search.includes('access_token');
      const hasHashParams = window.location.hash.includes('access_token');
      
      if (hasQueryParams || hasHashParams) {
        console.log('🔍 Auth parameters detected, processing immediately...');
        setStatus('loading');
        setMessage('Behandler innlogging...');
        
        // Send immediate message to parent window
        if (window.opener) {
          console.log('🔄 Sending immediate message to parent window...');
          window.opener.postMessage({ type: 'AUTH_PROCESSING', authenticated: false }, window.location.origin);
        }
      } else {
        setStatus('error');
        setMessage('Ingen autentiseringstokens funnet.');
        
        // Send error message to parent window
        if (window.opener) {
          console.log('🔄 Sending error message to parent window...');
          window.opener.postMessage({ type: 'AUTH_ERROR', authenticated: false }, window.location.origin);
        }
      }
    };

    handleCallback();
  }, []);

  // Separate useEffect to handle authentication status changes
  useEffect(() => {
    console.log('🔄 AuthCallback: isAuthenticated changed to:', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('✅ Authentication successful, updating UI...');
      setStatus('success');
      setMessage('Innlogging vellykket! Du blir omdirigert...');
      
      // Send success message to parent window and close immediately
      if (window.opener) {
        console.log('🔄 Sending success message to parent window...');
        window.opener.postMessage({ type: 'AUTH_SUCCESS', authenticated: true }, window.location.origin);
        
        // Close popup window immediately
        console.log('🔄 Closing popup window immediately...');
        setTimeout(() => {
          window.close();
        }, 500); // Shorter delay
      } else {
        // Redirect to main app if not a popup
        console.log('🔄 Redirecting to main app...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000); // Shorter delay
      }
    } else if (status === 'loading') {
      // Only show error if we were in loading state and still not authenticated after some time
      setTimeout(() => {
        if (!isAuthenticated && status === 'loading') {
          console.log('❌ Authentication failed after timeout');
          setStatus('error');
          setMessage('Innlogging feilet. Prøv igjen.');
          
          // Send error message to parent window
          if (window.opener) {
            console.log('🔄 Sending error message to parent window...');
            window.opener.postMessage({ type: 'AUTH_ERROR', authenticated: false }, window.location.origin);
          }
        }
      }, 3000); // Wait 3 seconds before showing error
    }
  }, [isAuthenticated, status]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
          <span className="text-2xl font-bold text-white">AI</span>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
            AI LABBEN
          </h2>
          
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'rgb(var(--orange-primary))' }} />
                <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  {message}
                </p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-8 w-8" style={{ color: 'rgb(var(--green-primary))' }} />
                <p className="text-sm" style={{ color: 'rgb(var(--green-primary))' }}>
                  {message}
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-8 w-8" style={{ color: 'rgb(var(--orange-primary))' }} />
                <p className="text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>
                  {message}
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200"
                  style={{ backgroundColor: 'rgb(var(--orange-primary))' }}
                >
                  Gå til innlogging
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
