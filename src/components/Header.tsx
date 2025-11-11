import { Menu, X, UserCircle, ChevronDown, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export const Header = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setIsMobileMenuOpen(false);
        }}
        className={`text-foreground hover:text-primary transition font-medium ${
          isActive ? 'text-primary' : ''
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold">R</span>
          </div>
          <h1 className="text-xl font-bold text-primary hidden md:block">
            A CLICK TO RWANDA
          </h1>
        </button>

        <nav className="hidden lg:flex items-center space-x-6">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/free-independent">Free Independent</NavLink>
          <NavLink to="/exclusive">Exclusive</NavLink>
          <NavLink to="/tour-operators">Tour Manager</NavLink>
          <NavLink to="/reviews">Reviews</NavLink>
          <NavLink to="/map">Map</NavLink>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-foreground hover:text-primary transition"
              >
                <UserCircle size={24} />
                <span className="hidden md:inline-block">
                  {user.email?.substring(0, 20)}...
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-2 z-50">
                  <p className="px-4 py-2 text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
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
            <div className="p-4 flex flex-col space-y-4">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/about">About Us</NavLink>
              <NavLink to="/free-independent">Free Independent</NavLink>
              <NavLink to="/exclusive">Exclusive</NavLink>
              <NavLink to="/tour-operators">Tour Manager</NavLink>
              <NavLink to="/reviews">Reviews</NavLink>
              <NavLink to="/map">Map</NavLink>
              {!user && (
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
