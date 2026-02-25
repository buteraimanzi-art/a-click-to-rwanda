import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Mail, Lock, User, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import logoImage from '@/assets/logo-click-to-rwanda.png';

const NATIONALITY_OPTIONS = [
  { value: 'rwandan', label: '🇷🇼 Rwandan Resident', price: 'Free' },
  { value: 'east_african', label: '🌍 East African', price: '$10/year' },
  { value: 'foreigner', label: '✈️ International Visitor', price: '$50/year' },
];

const Login = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('foreigner');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name, nationality }
          },
        });
        if (error) throw error;

        // Create profile with nationality
        if (data.user) {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            nationality,
          }, { onConflict: 'user_id' });
        }

        toast.success('Account created! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Facebook login failed');
      setLoading(false);
    }
  };

  const selectedOption = NATIONALITY_OPTIONS.find(o => o.value === nationality);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl w-full bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">
        {/* Illustration Side */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 flex flex-col items-center justify-center text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/2 animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          <img 
            src={logoImage} 
            alt="Click To Rwanda" 
            className="w-40 h-40 object-contain mb-6 animate-fade-in drop-shadow-2xl bg-white rounded-full p-4"
            style={{ animationDelay: '0.2s' }}
          />
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Discover Rwanda
          </h2>
          <p className="text-center text-primary-foreground/80 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Plan your perfect journey through the Land of a Thousand Hills
          </p>
          
          {/* Pricing tiers */}
          <div className="mt-8 space-y-2 w-full max-w-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/60 text-center mb-3">Subscription Pricing</h3>
            {NATIONALITY_OPTIONS.map((opt, i) => (
              <div 
                key={opt.value}
                className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 animate-fade-in"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <span className="text-sm">{opt.label}</span>
                <span className="text-sm font-bold">{opt.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Side */}
        <div className="md:w-1/2 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {isSignUp ? 'Start your Rwanda adventure today →' : 'Continue your journey →'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div 
                  className={`relative animate-fade-in transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}
                  style={{ animationDelay: '0.2s' }}
                >
                  <User 
                    size={20} 
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'name' ? 'text-primary' : 'text-muted-foreground'}`} 
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="What's your name?"
                    className="w-full pl-12 pr-4 py-4 border-2 border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                    required={isSignUp}
                  />
                </div>

                {/* Nationality selector */}
                <div 
                  className={`relative animate-fade-in transition-all duration-300 ${focusedField === 'nationality' ? 'scale-[1.02]' : ''}`}
                  style={{ animationDelay: '0.25s' }}
                >
                  <Globe 
                    size={20} 
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${focusedField === 'nationality' ? 'text-primary' : 'text-muted-foreground'}`} 
                  />
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    onFocus={() => setFocusedField('nationality')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-input rounded-xl bg-background text-foreground focus:border-primary focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 appearance-none cursor-pointer"
                    required
                  >
                    {NATIONALITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.price}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Price badge */}
                {selectedOption && (
                  <div className="animate-fade-in text-center">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${
                      nationality === 'rwandan' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : nationality === 'east_african'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      Your plan: {selectedOption.price}
                    </span>
                  </div>
                )}
              </>
            )}

            <div 
              className={`relative animate-fade-in transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}
              style={{ animationDelay: isSignUp ? '0.3s' : '0.2s' }}
            >
              <Mail 
                size={20} 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'}`} 
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-4 border-2 border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                required
              />
            </div>

            <div 
              className={`relative animate-fade-in transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}
              style={{ animationDelay: isSignUp ? '0.4s' : '0.3s' }}
            >
              <Lock 
                size={20} 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} 
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-4 py-4 border-2 border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-semibold rounded-xl animate-fade-in transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
              style={{ animationDelay: isSignUp ? '0.5s' : '0.4s' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 group">
                  {isSignUp ? (
                    <>
                      <UserPlus size={20} className="transition-transform duration-300 group-hover:scale-110" />
                      Sign Up
                    </>
                  ) : (
                    <>
                      <LogIn size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                      Log In
                    </>
                  )}
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div 
            className="flex items-center gap-4 my-5 animate-fade-in"
            style={{ animationDelay: isSignUp ? '0.55s' : '0.45s' }}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login Buttons */}
          <div 
            className="flex gap-4 animate-fade-in"
            style={{ animationDelay: isSignUp ? '0.6s' : '0.5s' }}
          >
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 py-3 px-4 border-2 border-input rounded-xl bg-background hover:bg-accent hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-foreground">Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 py-3 px-4 border-2 border-input rounded-xl bg-background hover:bg-accent hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-medium text-foreground">Facebook</span>
            </button>
          </div>

          <div 
            className="mt-5 text-center animate-fade-in"
            style={{ animationDelay: isSignUp ? '0.7s' : '0.6s' }}
          >
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setName('');
                setNationality('foreigner');
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-300 hover:underline underline-offset-4"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
