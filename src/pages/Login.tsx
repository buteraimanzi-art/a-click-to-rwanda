import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import logoImage from '@/assets/logo-click-to-rwanda.png';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name }
          },
        });
        if (error) throw error;
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl w-full bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">
        {/* Illustration Side */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 flex flex-col items-center justify-center text-primary-foreground relative overflow-hidden">
          {/* Animated background circles */}
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
          
          {/* Feature list */}
          <ul className="mt-8 space-y-3 text-sm">
            {['AI-Powered Trip Planning', 'Curated Experiences', 'Local Insights'].map((feature, i) => (
              <li 
                key={feature}
                className="flex items-center gap-2 animate-fade-in"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <span className="w-2 h-2 bg-primary-foreground rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Form Side */}
        <div className="md:w-1/2 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {isSignUp ? 'Start your Rwanda adventure today →' : 'Continue your journey →'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
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

          <div 
            className="mt-8 text-center animate-fade-in"
            style={{ animationDelay: isSignUp ? '0.6s' : '0.5s' }}
          >
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setName('');
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
