import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, DollarSign, Star, Calendar, Shield, Building2 } from 'lucide-react';
import logoImage from '@/assets/logo-click-to-rwanda.png';
import StatsGrid from '@/components/staff/StatsGrid';
import SubscriptionsTab from '@/components/staff/SubscriptionsTab';
import ReviewsTab from '@/components/staff/ReviewsTab';
import ItinerariesTab from '@/components/staff/ItinerariesTab';
import TourCompaniesTab from '@/components/staff/TourCompaniesTab';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalReviews: number;
  totalItineraries: number;
}

const StaffPortal = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isAuthorized, setIsAuthorized] = useState(false);
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
      // Fetch subscriptions
      const { data: subsData, count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch reviews
      const { data: reviewsData, count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch itineraries
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

      const userEmail = session.user.email?.toLowerCase();
      const isStaff = userEmail === 'buteraimanzi@gmail.com' || 
                      userEmail?.endsWith('@aclicktorwanda.com');

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Click to Rwanda" className="h-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Staff Portal</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <StatsGrid 
          totalUsers={stats.totalUsers}
          activeSubscriptions={stats.activeSubscriptions}
          totalReviews={stats.totalReviews}
          totalItineraries={stats.totalItineraries}
        />

        {/* Data Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscriptions">
              <DollarSign className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="itineraries">
              <Calendar className="w-4 h-4 mr-2" />
              Itineraries
            </TabsTrigger>
            <TabsTrigger value="tour-companies">
              <Building2 className="w-4 h-4 mr-2" />
              Tour Companies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <SubscriptionsTab 
              subscriptions={subscriptions} 
              onRefresh={fetchDashboardData} 
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab 
              reviews={reviews} 
              onRefresh={fetchDashboardData} 
            />
          </TabsContent>

          <TabsContent value="itineraries">
            <ItinerariesTab 
              itineraries={itineraries} 
              onRefresh={fetchDashboardData} 
            />
          </TabsContent>

          <TabsContent value="tour-companies">
            <TourCompaniesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StaffPortal;
