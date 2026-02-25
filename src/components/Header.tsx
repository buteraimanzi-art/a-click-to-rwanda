import { Menu, X, UserCircle, ChevronDown, LogIn, LogOut, Home, Info, Compass, Bot, Crown, Building2, Star, Map } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import logoImage from '@/assets/logo-click-to-rwanda.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Header = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'Traveler';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const NavLink = ({ to, children, icon }: { to: string; children: React.ReactNode; icon?: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/70 hover:text-primary hover:bg-primary/5'
        }`}
      >
        {icon}
        {children}
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center space-x-3">
          <img src={logoImage} alt="Click to Rwanda" className="h-12 w-auto" />
          <h1 className="text-xl font-bold text-primary hidden md:block">
            A CLICK TO RWANDA
          </h1>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/" icon={<Home size={15} />}>Home</NavLink>
          <NavLink to="/about" icon={<Info size={15} />}>About</NavLink>
          <NavLink to="/free-independent" icon={<Compass size={15} />}>Free Independent</NavLink>
          <NavLink to="/ai-planner" icon={<Bot size={15} />}>AI Planner</NavLink>
          <NavLink to="/exclusive" icon={<Crown size={15} />}>Exclusive</NavLink>
          <NavLink to="/tour-operators" icon={<Building2 size={15} />}>Tour Manager</NavLink>
          <NavLink to="/reviews" icon={<Star size={15} />}>Reviews</NavLink>
          <NavLink to="/map" icon={<Map size={15} />}>Map</NavLink>
        </nav>

        <div className="flex items-center space-x-4">
        {user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-foreground hover:text-primary transition"
              >
                <UserCircle size={24} />
                <span className="hidden md:inline-block font-medium">
                  {getUserDisplayName()}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-2 z-50 animate-scale-in">
                  <p className="px-4 py-2 text-sm font-medium text-foreground truncate border-b border-border">
                    {getUserDisplayName()}
                  </p>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <UserCircle size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 flex items-center gap-2 group"
                  >
                    <LogOut size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                    <span className="transition-transform duration-300 group-hover:translate-x-1">Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="hidden md:flex items-center space-x-2"
            >
              <LogIn size={20} />
              <span>Login</span>
            </Button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-foreground focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-card shadow-xl z-40 lg:hidden border-b border-border">
          <div className="p-4 flex flex-col gap-1">
              <NavLink to="/" icon={<Home size={16} />}>Home</NavLink>
              <NavLink to="/about" icon={<Info size={16} />}>About</NavLink>
              <NavLink to="/free-independent" icon={<Compass size={16} />}>Free Independent</NavLink>
              <NavLink to="/ai-planner" icon={<Bot size={16} />}>AI Planner</NavLink>
              <NavLink to="/exclusive" icon={<Crown size={16} />}>Exclusive</NavLink>
              <NavLink to="/tour-operators" icon={<Building2 size={16} />}>Tour Manager</NavLink>
              <NavLink to="/reviews" icon={<Star size={16} />}>Reviews</NavLink>
              <NavLink to="/map" icon={<Map size={16} />}>Map</NavLink>
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-primary/10 transition-all duration-300 flex items-center gap-2 rounded-md border border-border"
                  >
                    <UserCircle size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-left text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 flex items-center gap-2 group rounded-md border border-destructive"
                  >
                    <LogOut size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                    <span className="transition-transform duration-300 group-hover:translate-x-1">Logout</span>
                  </button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')} variant="outline">
                  <LogIn size={20} className="mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
