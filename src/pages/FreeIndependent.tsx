import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import RwandaMap from '@/components/RwandaMap';

const FreeIndependent = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [dayNotes, setDayNotes] = useState('');

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hotels').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: cars } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cars').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: itinerary = [] } = useQuery({
    queryKey: ['itinerary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Prepare map locations from itinerary
  const mapLocations = useMemo(() => {
    const locations: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      type: 'destination' | 'hotel';
    }> = [];

    itinerary.forEach((item) => {
      const destination = destinations?.find((d) => d.id === item.destination_id);
      if (destination?.latitude && destination?.longitude) {
        locations.push({
          id: destination.id,
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
          type: 'destination',
        });
      }

      if (item.hotel_id) {
        const hotel = hotels?.find((h) => h.id === item.hotel_id);
        if (hotel?.latitude && hotel?.longitude) {
          locations.push({
            id: hotel.id,
            name: hotel.name,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            type: 'hotel',
          });
        }
      }
    });

    return locations;
  }, [itinerary, destinations, hotels]);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDestination || !selectedDate) throw new Error('Missing required data');
      
      const { error } = await supabase.from('itineraries').insert({
        user_id: user.id,
        destination_id: selectedDestination,
        hotel_id: selectedHotel || null,
        activity_id: selectedActivity || null,
        date: selectedDate,
        notes: dayNotes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      setSelectedDestination('');
      setSelectedDate('');
      setSelectedHotel('');
      setSelectedActivity('');
      setDayNotes('');
      toast.success('Day added to itinerary');
    },
    onError: () => toast.error('Failed to add day'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: string;
    }) => {
      const { error } = await supabase
        .from('itineraries')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['itinerary'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('itineraries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      toast.success('Item removed');
    },
  });

  const handleDownload = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>My Rwanda Itinerary</title>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f3f4f6; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; }
          .header { background: #145833; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .item { padding: 15px; border-bottom: 1px solid #e5e7eb; }
          .item-header { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>My Rwanda Adventure</h1></div>
          ${itinerary
            .map(
              (item) => `
            <div class="item">
              <div class="item-header">${destinations?.find((d) => d.id === item.destination_id)?.name || item.destination_id}</div>
              <p><strong>Date:</strong> ${item.date}</p>
              <p><strong>Hotel:</strong> ${hotels?.find((h) => h.id === item.hotel_id)?.name || 'Not selected'}</p>
              <p><strong>Car:</strong> ${cars?.find((c) => c.id === item.car_id)?.name || 'Not selected'}</p>
              <p><strong>Activity:</strong> ${activities?.find((a) => a.id === item.activity_id)?.name || 'Not selected'}</p>
              <p><strong>Notes:</strong> ${item.notes || 'No notes'}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rwanda-itinerary.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Itinerary downloaded');
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-8 pt-20 text-center">
        <h2 className="text-4xl font-bold text-primary mb-4">Please Log In</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You need to be logged in to plan your independent trip.
        </p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 pt-20">
      <h2 className="text-4xl font-bold text-center text-primary mb-4">
        Plan Your Free Independent Trip
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12">
        Build your perfect adventure by adding destinations and services to your personalized
        itinerary.
      </p>

      {/* Interactive Map */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Your Journey Route</h3>
        <RwandaMap selectedLocations={mapLocations} showRoutes={true} />
      </div>

      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold mb-4 flex items-center">
          <Plus size={24} className="mr-2" /> Add Day to Itinerary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-1" /> Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Destination *</label>
            <select
              value={selectedDestination}
              onChange={(e) => {
                setSelectedDestination(e.target.value);
                setSelectedHotel('');
                setSelectedActivity('');
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="">-- Choose destination --</option>
              {destinations?.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hotel</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={!selectedDestination}
            >
              <option value="">-- Choose hotel --</option>
              {hotels
                ?.filter((h) => h.destination_id === selectedDestination)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Activity</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={!selectedDestination}
            >
              <option value="">-- Choose activity --</option>
              {activities
                ?.filter((a) => a.destination_id === selectedDestination)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <input
              type="text"
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any special plans for this day..."
            />
          </div>
        </div>
        
        <Button 
          onClick={() => addMutation.mutate()} 
          disabled={!selectedDestination || !selectedDate}
          className="mt-4 w-full md:w-auto"
        >
          <Plus size={20} className="mr-2" /> Add Day
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold flex items-center">
            <BookOpen size={24} className="mr-2" /> My Itinerary
          </h3>
          {itinerary.length > 0 && (
            <Button onClick={handleDownload} variant="outline">
              <Download size={20} className="mr-2" /> Download
            </Button>
          )}
        </div>

        {itinerary.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Your itinerary is empty. Add days above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {itinerary.map((item, index) => {
              const destination = destinations?.find((d) => d.id === item.destination_id);
              const hotel = hotels?.find((h) => h.id === item.hotel_id);
              const activity = activities?.find((a) => a.id === item.activity_id);
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={item.id} className="border border-border rounded-lg p-5 bg-background/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Day {index + 1}</div>
                      <h4 className="text-2xl font-bold text-primary">{destination?.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Calendar size={14} className="inline mr-1" />
                        {formattedDate}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                      <input
                        type="date"
                        value={item.date || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: item.id,
                            field: 'date',
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Hotel</label>
                      <select
                        value={item.hotel_id || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: item.id,
                            field: 'hotel_id',
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      >
                        <option value="">Not selected</option>
                        {hotels
                          ?.filter((h) => h.destination_id === item.destination_id)
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Activity</label>
                      <select
                        value={item.activity_id || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: item.id,
                            field: 'activity_id',
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      >
                        <option value="">Not selected</option>
                        {activities
                          ?.filter((a) => a.destination_id === item.destination_id)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {hotel && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Accommodation:</span> {hotel.name}
                    </div>
                  )}
                  
                  {activity && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Planned Activity:</span> {activity.name}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: item.id,
                          field: 'notes',
                          value: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      rows={2}
                      placeholder="Add any special notes or requests for this day..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeIndependent;
