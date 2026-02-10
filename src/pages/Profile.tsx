import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  User, Package, Calendar, Star, Trash2, ExternalLink, 
  MapPin, Hotel, Activity, Clock, Loader2, CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TravelCalendarProps {
  itineraries: any[];
  destinations: any[] | undefined;
  hotels: any[] | undefined;
  activities: any[] | undefined;
  getDestinationName: (id: string) => string;
  getHotelName: (id: string | null) => string | null;
  getActivityName: (id: string | null) => string | null;
}

const TravelCalendar = ({ itineraries, getDestinationName, getHotelName, getActivityName }: TravelCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const itineraryDates = useMemo(() => itineraries.map(i => new Date(i.date)), [itineraries]);
  const bookedDates = useMemo(() => itineraries.filter(i => i.is_booked || i.all_confirmed).map(i => new Date(i.date)), [itineraries]);
  const unbookedDates = useMemo(() => itineraries.filter(i => !i.is_booked && !i.all_confirmed).map(i => new Date(i.date)), [itineraries]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    return itineraries.find(i => isSameDay(new Date(i.date), selectedDate));
  }, [selectedDate, itineraries]);

  const modifiers = useMemo(() => ({
    booked: bookedDates,
    unbooked: unbookedDates,
  }), [bookedDates, unbookedDates]);

  const modifiersClassNames = {
    booked: 'bg-green-500 text-white hover:bg-green-600 font-bold',
    unbooked: 'bg-red-500 text-white hover:bg-red-600 font-bold',
  };

  const dateRange = useMemo(() => {
    if (itineraries.length === 0) return new Date();
    return new Date(Math.min(...itineraryDates.map(d => d.getTime())));
  }, [itineraries, itineraryDates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          My Travel Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Booked / Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Not Booked</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-shrink-0">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              defaultMonth={dateRange}
              numberOfMonths={2}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          <div className="flex-1">
            {selectedDayInfo ? (
              <Card className={cn(
                'border-2',
                (selectedDayInfo.is_booked || selectedDayInfo.all_confirmed) ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(new Date(selectedDayInfo.date), 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <Badge className={cn(
                      (selectedDayInfo.is_booked || selectedDayInfo.all_confirmed) 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-500 hover:bg-red-600'
                    )}>
                      {(selectedDayInfo.is_booked || selectedDayInfo.all_confirmed) ? '✅ Booked' : '❌ Not Booked'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{getDestinationName(selectedDayInfo.destination_id)}</span>
                  </div>
                  <Badge variant="outline">{selectedDayInfo.day_type === 'transfer' ? 'Transfer Day' : 'Regular Day'}</Badge>
                  {selectedDayInfo.hotel_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hotel className="w-4 h-4 text-muted-foreground" />
                      <span>{getHotelName(selectedDayInfo.hotel_id)}</span>
                      {selectedDayInfo.hotel_booked ? (
                        <Badge className="bg-green-500 text-xs">Booked</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-xs">Not Booked</Badge>
                      )}
                    </div>
                  )}
                  {selectedDayInfo.activity_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span>{getActivityName(selectedDayInfo.activity_id)}</span>
                      {selectedDayInfo.activity_booked ? (
                        <Badge className="bg-green-500 text-xs">Booked</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-xs">Not Booked</Badge>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                    {selectedDayInfo.wake_time && <p>⏰ Wake: {selectedDayInfo.wake_time}</p>}
                    {selectedDayInfo.breakfast_time && <p>🍳 Breakfast: {selectedDayInfo.breakfast_time}</p>}
                    {selectedDayInfo.lunch_time && <p>🍽️ Lunch: {selectedDayInfo.lunch_time}</p>}
                    {selectedDayInfo.dinner_time && <p>🍷 Dinner: {selectedDayInfo.dinner_time}</p>}
                  </div>
                  {selectedDayInfo.notes && (
                    <p className="text-sm bg-muted/50 p-2 rounded">{selectedDayInfo.notes}</p>
                  )}
                </CardContent>
              </Card>
            ) : itineraries.length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                <p>Click a highlighted date to see details</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                <p>No travel days planned yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  const { user, isAuthReady } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch saved packages
  const { data: savedPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ['saved-tour-packages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_tour_packages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch itineraries
  const { data: itineraries, isLoading: itinerariesLoading } = useQuery({
    queryKey: ['itinerary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch destinations for display
  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch hotels for display
  const { data: hotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hotels').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch activities for display
  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_tour_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tour-packages'] });
      toast.success('Package deleted');
    },
    onError: () => toast.error('Failed to delete package'),
  });

  // Delete itinerary mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('itineraries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      toast.success('Itinerary day deleted');
    },
    onError: () => toast.error('Failed to delete itinerary'),
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'Traveler';
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <User className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Login Required</h2>
            <p className="text-muted-foreground">Please login to view your profile</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDestinationName = (id: string) => 
    destinations?.find(d => d.id === id)?.name || id;

  const getHotelName = (id: string | null) => 
    id ? (hotels?.find(h => h.id === id)?.name || id) : null;

  const getActivityName = (id: string | null) => 
    id ? (activities?.find(a => a.id === id)?.name || id) : null;

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{getUserDisplayName()}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Package className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{savedPackages?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Saved Packages</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold text-foreground">{itineraries?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Itinerary Days</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <Star className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{reviews?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="packages" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">My Travel Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="itineraries" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Itineraries</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          </TabsList>

          {/* Saved Packages Tab */}
          <TabsContent value="packages" className="mt-4 space-y-4">
            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : savedPackages && savedPackages.length > 0 ? (
              savedPackages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{pkg.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {new Date(pkg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/ai-planner')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deletePackageMutation.mutate(pkg.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {(pkg.conversation_history as unknown[])?.length || 0} messages
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No saved packages yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/ai-planner')}>
                    Create Your First Package
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Travel Calendar Tab */}
          <TabsContent value="calendar" className="mt-4">
            <TravelCalendar
              itineraries={itineraries || []}
              destinations={destinations}
              hotels={hotels}
              activities={activities}
              getDestinationName={getDestinationName}
              getHotelName={getHotelName}
              getActivityName={getActivityName}
            />
          </TabsContent>

          {/* Itineraries Tab */}
          <TabsContent value="itineraries" className="mt-4 space-y-4">
            {itinerariesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : itineraries && itineraries.length > 0 ? (
              itineraries.map((item, index) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {getDestinationName(item.destination_id)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={item.day_type === 'transfer' ? 'secondary' : 'outline'}>
                          {item.day_type === 'transfer' ? 'Transfer' : 'Regular'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteItineraryMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-3 text-sm">
                      {item.hotel_id && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Hotel className="w-4 h-4" />
                          {getHotelName(item.hotel_id)}
                        </div>
                      )}
                      {item.activity_id && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="w-4 h-4" />
                          {getActivityName(item.activity_id)}
                        </div>
                      )}
                      {item.wake_time && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Wake: {item.wake_time}
                        </div>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {item.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No itinerary days planned yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/free-independent')}>
                    Start Planning Your Trip
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          {getDestinationName(review.destination_id)}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{review.comment}</p>
                    <Badge variant="outline" className="mt-3">
                      {review.display_name || 'Anonymous Traveler'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/reviews')}>
                    Write Your First Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
