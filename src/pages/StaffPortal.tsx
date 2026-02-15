import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, DollarSign, Star, Calendar, Shield, Building2, MapPin, AlertCircle, MessageSquare, LayoutDashboard, Menu, X } from 'lucide-react';
import logoImage from '@/assets/logo-click-to-rwanda.png';
import StatsGrid from '@/components/staff/StatsGrid';
import SubscriptionsTab from '@/components/staff/SubscriptionsTab';
import ReviewsTab from '@/components/staff/ReviewsTab';
import ItinerariesTab from '@/components/staff/ItinerariesTab';
import TourCompaniesTab from '@/components/staff/TourCompaniesTab';
import DestinationsHotelsTab from '@/components/staff/DestinationsHotelsTab';
import SOSAlertsTab from '@/components/staff/SOSAlertsTab';
import MessagingTab from '@/components/staff/MessagingTab';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalReviews: number;
  totalItineraries: number;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'itineraries', label: 'Itineraries', icon: Calendar },
  { id: 'tour-companies', label: 'Tour Companies', icon: Building2 },
  { id: 'destinations-hotels', label: 'Destinations & Hotels', icon: MapPin },
  { id: 'sos-alerts', label: 'SOS Alerts', icon: AlertCircle },
  { id: 'messaging', label: 'Messages', icon: MessageSquare },
];

const StaffPortal = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalReviews: 0,
    totalItineraries: 0,
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: subsData, count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: reviewsData, count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: itinData, count: itinCount } = await supabase
        .from('itineraries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      setStats({
        totalUsers: subsCount || 0,
        activeSubscriptions: subsData?.filter(s => s.status === 'active').length || 0,
        totalReviews: reviewsCount || 0,
        totalItineraries: itinCount || 0,
      });

      setSubscriptions(subsData || []);
      setReviews(reviewsData || []);
      setItineraries(itinData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/staff-login');
        return;
      }

      // Verify staff access via edge function
      const { data: staffCheck, error: staffError } = await supabase.functions.invoke('staff-management', {
        body: { entity: 'auth', action: 'check_staff' }
      });
      const isStaff = !staffError && staffCheck?.isStaff;

      if (!isStaff) {
        navigate('/');
        return;
      }

      setIsAuthorized(true);
      fetchDashboardData();
    };

    checkAuth();
  }, [navigate, fetchDashboardData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/staff-login');
  };

  if (!isAuthorized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <StatsGrid 
              totalUsers={stats.totalUsers}
              activeSubscriptions={stats.activeSubscriptions}
              totalReviews={stats.totalReviews}
              totalItineraries={stats.totalItineraries}
            />
          </div>
        );
      case 'subscriptions':
        return <SubscriptionsTab subscriptions={subscriptions} onRefresh={fetchDashboardData} />;
      case 'reviews':
        return <ReviewsTab reviews={reviews} onRefresh={fetchDashboardData} />;
      case 'itineraries':
        return <ItinerariesTab itineraries={itineraries} onRefresh={fetchDashboardData} />;
      case 'tour-companies':
        return <TourCompaniesTab />;
      case 'destinations-hotels':
        return <DestinationsHotelsTab />;
      case 'sos-alerts':
        return <SOSAlertsTab />;
      case 'messaging':
        return <MessagingTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full bg-[hsl(230,25%,15%)] text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          !sidebarOpen && 'overflow-hidden lg:overflow-visible'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <img src={logoImage} alt="Click to Rwanda" className="h-8 flex-shrink-0" />
          {sidebarOpen && (
            <span className="font-bold text-sm whitespace-nowrap">Staff Portal</span>
          )}
        </div>

        {/* Menu Label */}
        {sidebarOpen && (
          <div className="px-4 pt-4 pb-2 text-xs uppercase tracking-wider text-white/40 font-semibold">
            Menu
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  // Close sidebar on mobile after selection
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <Shield className="w-4 h-4 text-white/50 flex-shrink-0" />
              <span className="text-xs text-white/50 truncate">{user?.email}</span>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full text-white/70 hover:text-white hover:bg-white/10',
              !sidebarOpen && 'px-0 justify-center'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        'flex-1 transition-all duration-300',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-bold text-foreground capitalize">
              {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StaffPortal;
