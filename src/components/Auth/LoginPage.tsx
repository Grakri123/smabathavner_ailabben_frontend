import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Link } from 'lucide-react';
import { useAuth } from '../../store/authStore';

const LoginPage: React.FC = () => {
  const { signInWithMagicLink, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  

  // Auto-focus on email field when component mounts
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  // Listen for postMessage from callback window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the same origin
      if (event.origin !== window.location.origin) return;
      
      console.log('📨 Received message from callback window:', event.data);
      
      if (event.data.type === 'AUTH_SUCCESS') {
        console.log('✅ Authentication successful from callback window');
        // Clear magic link sent state since user is now logged in
        localStorage.removeItem('magicLinkSent');
        // The auth store will handle the redirect automatically
      } else if (event.data.type === 'AUTH_ERROR') {
        console.log('❌ Authentication failed from callback window');
        setErrors({ magicLink: 'Innlogging feilet. Prøv igjen.' });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleInputChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setErrors({ email: 'E-post er påkrevd' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Ugyldig e-post format' });
      return false;
    }
    return true;
  };

  const handleMagicLink = async () => {
    if (!validateEmail()) return;

    setIsSendingMagicLink(true);
    setErrors({});

    try {
      const result = await signInWithMagicLink(email);
      console.log('🔍 Magic link result:', result);
      
      if (result.success) {
        console.log('✅ Setting magicLinkSent to true');
        setMagicLinkSent(true);
      } else {
        console.log('❌ Magic link failed:', result.error);
        const error = result.error || 'Kunne ikke sende magic link';
        setErrors({ magicLink: error });
        
        // Extract countdown from rate limit error
        const match = error.match(/Vent (\d+) sekunder/);
        if (match) {
          const seconds = parseInt(match[1]);
          setRateLimitSeconds(seconds);
          
          // Start countdown
          const interval = setInterval(() => {
            setRateLimitSeconds(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                setErrors({});
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Magic link error:', error);
      setErrors({ magicLink: 'En uventet feil oppstod. Prøv igjen.' });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMagicLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
          <p className="mt-4 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'rgb(var(--background))' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
            <span className="text-2xl font-bold text-white">AI</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
            AI LABBEN
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
            Logg inn med magic link
          </p>
        </div>

        {/* Magic Link Form */}
        <div className="mt-8 space-y-6">
          <div className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'rgb(var(--card))', border: '1px solid rgb(var(--border))' }}>
            {errors.magicLink && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgb(var(--orange-100))', border: '1px solid rgb(var(--orange-primary))', color: 'rgb(var(--orange-primary))' }}>
                {errors.magicLink}
              </div>
            )}


            <div className="space-y-4">
              {!magicLinkSent ? (
                <>
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                      E-post
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5" style={{ color: 'rgb(var(--muted-foreground))' }} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="block w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                        style={{ 
                          border: errors.email ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                          backgroundColor: 'rgb(var(--background))',
                          color: 'rgb(var(--foreground))'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'rgb(var(--orange-primary))';
                          e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.email ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Din e-post"
                        disabled={isSendingMagicLink}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.email}</p>
                    )}
                  </div>

                  {/* Magic Link Button */}
                  <button
                    type="button"
                    onClick={handleMagicLink}
                    disabled={isSendingMagicLink || rateLimitSeconds > 0}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgb(var(--orange-primary))' }}
                    onMouseEnter={(e) => {
                      if (!isSendingMagicLink && rateLimitSeconds === 0) {
                        e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSendingMagicLink && rateLimitSeconds === 0) {
                        e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
                      }
                    }}
                  >
                    {isSendingMagicLink ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sender magic link...
                      </>
                    ) : rateLimitSeconds > 0 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Prøv igjen om {rateLimitSeconds}s
                      </>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        Send magic link til e-post
                      </>
                    )}
                  </button>

                </>
              ) : (
                /* Magic Link Sent Confirmation */
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full mb-4" style={{ backgroundColor: 'rgb(var(--muted))' }}>
                    <Mail className="h-8 w-8" style={{ color: 'rgb(var(--orange-primary))' }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                    Magic link sendt!
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Sendt til: <span className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{email}</span>
                  </p>
                  <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgb(var(--muted))', border: '1px solid rgb(var(--border))' }}>
                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                      Du vil motta din egen link på epost, følg den for innlogging
                    </p>
                  </div>
                  
                  {/* Send Again Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setErrors({});
                    }}
                    className="text-sm underline transition-colors duration-200"
                    style={{ color: 'rgb(var(--muted-foreground))' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgb(var(--orange-primary))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgb(var(--muted-foreground))';
                    }}
                  >
                    Mottok ikke e-posten? Send på nytt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;