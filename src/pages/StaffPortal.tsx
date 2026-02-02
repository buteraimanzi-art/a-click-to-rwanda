import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  LogOut, 
  MapPin, 
  Star,
  Shield,
  TrendingUp
} from 'lucide-react';
import logoImage from '@/assets/logo-click-to-rwanda.png';

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
        toast.error('Access denied');
        navigate('/');
        return;
      }

      setIsAuthorized(true);
      fetchDashboardData();
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch subscriptions
      const { data: subsData, count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch reviews
      const { data: reviewsData, count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch itineraries
      const { data: itinData, count: itinCount } = await supabase
        .from('itineraries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

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
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subscriptions
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSubscriptions} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscribers
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.activeSubscriptions * 50} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reviews
              </CardTitle>
              <Star className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">User feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Itineraries
              </CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItineraries}</div>
              <p className="text-xs text-muted-foreground">Trip plans created</p>
            </CardContent>
          </Card>
        </div>

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
          </TabsList>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>Latest premium subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No subscriptions yet</p>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{sub.user_id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">${sub.amount}</span>
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>User feedback on destinations</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{review.display_name || 'Anonymous'}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itineraries">
            <Card>
              <CardHeader>
                <CardTitle>Recent Itineraries</CardTitle>
                <CardDescription>User trip plans</CardDescription>
              </CardHeader>
              <CardContent>
                {itineraries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No itineraries yet</p>
                ) : (
                  <div className="space-y-4">
                    {itineraries.map((itin) => (
                      <div key={itin.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{itin.destination_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(itin.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={itin.is_booked ? 'default' : 'outline'}>
                          {itin.is_booked ? 'Booked' : 'Planned'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StaffPortal;
