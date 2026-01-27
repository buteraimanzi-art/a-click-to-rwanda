import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, BookOpen, Calendar, Bell, ExternalLink, Mail, Loader2, Check, Car, Hotel, MapPin, CheckCircle2, DollarSign, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import RwandaMap from '@/components/RwandaMap';
import { calculateDistance, estimateTravelTime, formatDistance } from '@/lib/utils';
import {
  requestNotificationPermission,
  scheduleItineraryNotifications,
  saveScheduledNotifications,
  startNotificationChecker,
  sendTestNotification,
} from '@/lib/notifications';

// Hotel-specific booking URLs
const HOTEL_BOOKING_URLS: Record<string, string> = {
  // Kigali hotels
  'hotel-c': 'https://www.serenahotels.com/kigali', // Kigali Serena Hotel
  'hotel-d': 'https://www.radissonhotels.com/en-us/hotels/radisson-blu-convention-kigali', // Radisson Blu Hotel
  // Musanze hotels
  'hotel-b': 'https://fivevolcanoesrwanda.com/', // Five Volcanoes Boutique Hotel
  'hotel-a': 'https://3bhotels.com/branches/mountain-gorilla-view-lodge/', // Mountain Gorilla View Lodge
};

// Helper function to get booking URL based on destination or hotel
const getBookingUrl = (destinationId: string, type: 'destination' | 'hotel', hotelId?: string | null) => {
  // If it's a hotel booking and we have a specific hotel URL, use that
  if (type === 'hotel' && hotelId && HOTEL_BOOKING_URLS[hotelId]) {
    return HOTEL_BOOKING_URLS[hotelId];
  }
  
  // All museums use Irembo for booking guided tours
  const museumIds = [
    'kandt-house', 'kings-palace', 'ethnographic', 'liberation', 
    'art-gallery', 'rwanda-art', 'nyanza-art', 'presidential-palace', 
    'environment', 'campaign-genocide'
  ];
  
  const urls: Record<string, { destination: string; hotel?: string }> = {
    akagera: {
      destination: 'https://visitakagera.org/book-now/',
      hotel: 'https://visitakagera.org/book-now/',
    },
    nyungwe: {
      destination: 'https://visitnyungwe.org/book-now/',
      hotel: 'https://visitnyungwe.org/book-now/',
    },
    musanze: {
      destination: 'https://visitrwandabookings.rdb.rw/rdbportal/web/tourism/tourist-permit#_48_INSTANCE_vnEd4049BXg8_%3Dhttps%253A%252F%252Fvisitrwandabookings.rdb.rw%252FrdbBooking%252Ftourismpermit_v1%252FTourismPermit_v1.xhtml%253F%2526lang%253Den',
      hotel: null,
    },
    volcanoes: {
      destination: 'https://visitrwandabookings.rdb.rw/rdbportal/web/tourism/tourist-permit#_48_INSTANCE_vnEd4049BXg8_%3Dhttps%253A%252F%252Fvisitrwandabookings.rdb.rw%252FrdbBooking%252Ftourismpermit_v1%252FTourismPermit_v1.xhtml%253F%2526lang%253Den',
      hotel: null,
    },
  };
  
  // Check if it's a museum - all museums use Irembo
  if (museumIds.includes(destinationId.toLowerCase())) {
    return 'https://irembo.gov.rw/home/citizen/all_services';
  }

  const destUrls = urls[destinationId.toLowerCase()];
  if (!destUrls) return null;
  
  return type === 'destination' ? destUrls.destination : (destUrls.hotel || destUrls.destination);
};

// Car rental booking URLs - using Kayak for Kigali car rentals
const CAR_BOOKING_URLS = [
  { name: 'Kayak - Kigali Car Rentals', url: 'https://www.kayak.com/Cheap-Kigali-Car-Rentals.15534.cars.ksp' },
  { name: 'Kigali Car Rental', url: 'https://kigalicarrental.rw/' },
  { name: 'Rwanda Car Hire', url: 'https://rwandacarhire.com/' },
];

const FreeIndependent = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dayType, setDayType] = useState<'regular' | 'transfer'>('regular');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedCar, setSelectedCar] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [dayNotes, setDayNotes] = useState('');
  const [useSameHotel, setUseSameHotel] = useState(false);
  const [useSameCar, setUseSameCar] = useState(false);
  const [wakeTime, setWakeTime] = useState('06:00');
  const [breakfastTime, setBreakfastTime] = useState('07:00');
  const [lunchTime, setLunchTime] = useState('12:30');
  const [dinnerTime, setDinnerTime] = useState('19:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [showCostInputs, setShowCostInputs] = useState(false);

  // Start notification checker on mount
  useEffect(() => {
    const cleanup = startNotificationChecker();
    return cleanup;
  }, []);

  // Check notification permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleTestNotification = async () => {
    setTestingNotification(true);
    const success = await sendTestNotification();
    if (success) {
      setNotificationsEnabled(true);
      toast.success('Test notification sent! Check your device.');
    } else {
      toast.error('Please enable notifications in your browser settings.');
    }
    setTestingNotification(false);
  };

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
      if (!user || !selectedDate) throw new Error('Missing required data');
      if (dayType === 'transfer' && (!selectedOrigin || !selectedDestination)) {
        throw new Error('Transfer requires origin and destination');
      }
      if (dayType === 'regular' && !selectedDestination) {
        throw new Error('Regular day requires destination');
      }

      // Determine hotel and car IDs based on "same as previous" options
      let hotelId = selectedHotel || null;
      let carId = selectedCar || null;

      if (useSameHotel && itinerary.length > 0) {
        hotelId = itinerary[itinerary.length - 1].hotel_id;
      }
      if (useSameCar && itinerary.length > 0) {
        carId = itinerary[itinerary.length - 1].car_id;
      }
      
      const { error } = await supabase.from('itineraries').insert({
        user_id: user.id,
        day_type: dayType,
        origin_id: dayType === 'transfer' ? selectedOrigin : null,
        destination_id: selectedDestination,
        hotel_id: hotelId,
        car_id: carId,
        activity_id: selectedActivity || null,
        date: selectedDate,
        notes: dayNotes,
        wake_time: wakeTime,
        breakfast_time: breakfastTime,
        lunch_time: lunchTime,
        dinner_time: dinnerTime,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      setDayType('regular');
      setSelectedOrigin('');
      setSelectedDestination('');
      setSelectedDate('');
      setSelectedHotel('');
      setSelectedCar('');
      setSelectedActivity('');
      setDayNotes('');
      setUseSameHotel(false);
      setUseSameCar(false);
      setWakeTime('06:00');
      setBreakfastTime('07:00');
      setLunchTime('12:30');
      setDinnerTime('19:00');
      toast.success('Day added to itinerary');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add day'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: string | boolean;
    }) => {
      const { error } = await supabase
        .from('itineraries')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['itinerary'] }),
  });

  // Mark booking status
  const toggleBookingStatus = (id: string, field: 'hotel_booked' | 'activity_booked', currentValue: boolean) => {
    updateMutation.mutate({ id, field, value: !currentValue });
  };

  // Confirm all bookings
  const confirmAllBookings = async () => {
    if (!user || itinerary.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ all_confirmed: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
      toast.success('All bookings confirmed!');
    } catch (error) {
      toast.error('Failed to confirm bookings');
    }
  };

  // Check if all items are booked
  const allItemsBooked = useMemo(() => {
    if (itinerary.length === 0) return false;
    return itinerary.every(item => {
      const hasHotel = !item.hotel_id || item.hotel_booked;
      const hasActivity = !item.activity_id || item.activity_booked;
      return hasHotel && hasActivity;
    });
  }, [itinerary]);

  const allConfirmed = useMemo(() => {
    return itinerary.length > 0 && itinerary.every(item => item.all_confirmed);
  }, [itinerary]);

  // Calculate total costs
  const totalCosts = useMemo(() => {
    return itinerary.reduce((acc, item) => ({
      hotel: acc.hotel + (Number(item.hotel_cost) || 0),
      activity: acc.activity + (Number(item.activity_cost) || 0),
      car: acc.car + (Number(item.car_cost) || 0),
      transport: acc.transport + (Number(item.transport_cost) || 0),
      other: acc.other + (Number(item.other_cost) || 0),
    }), { hotel: 0, activity: 0, car: 0, transport: 0, other: 0 });
  }, [itinerary]);

  const grandTotal = totalCosts.hotel + totalCosts.activity + totalCosts.car + totalCosts.transport + totalCosts.other;

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rwanda Travel Itinerary</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #1a5c3a 0%, #145833 50%, #0f4027 100%);
            padding: 40px 20px;
            color: #333;
          }
          .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header { 
            background: linear-gradient(135deg, #145833 0%, #1a5c3a 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          }
          .header h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          .header p { 
            font-size: 1.1em; 
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .summary {
            background: #f8f9fa;
            padding: 25px 30px;
            border-bottom: 3px solid #145833;
          }
          .summary h2 {
            color: #145833;
            margin-bottom: 15px;
            font-size: 1.5em;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #145833;
          }
          .summary-label {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 1.3em;
            font-weight: bold;
            color: #145833;
          }
          .itinerary {
            padding: 30px;
          }
          .day-item { 
            margin-bottom: 30px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s;
            background: white;
          }
          .day-header {
            background: linear-gradient(135deg, #145833 0%, #1a5c3a 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .day-number {
            font-size: 0.9em;
            opacity: 0.9;
            font-weight: 500;
          }
          .day-title {
            font-size: 1.8em;
            font-weight: bold;
            margin: 5px 0;
          }
          .day-date {
            font-size: 0.95em;
            opacity: 0.9;
          }
          .day-content {
            padding: 25px;
          }
          .transfer-badge {
            display: inline-block;
            background: #fbbf24;
            color: #92400e;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .detail-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #145833;
          }
          .detail-label {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 1.1em;
            font-weight: 600;
            color: #145833;
          }
          .notes-section {
            background: #fffbeb;
            border: 1px solid #fbbf24;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
          }
          .notes-label {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
          }
          .notes-text {
            color: #78350f;
            line-height: 1.6;
          }
          .footer {
            background: #f8f9fa;
            padding: 25px;
            text-align: center;
            color: #666;
            border-top: 2px solid #e5e7eb;
          }
          .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
          }
          @media print {
            body { padding: 0; background: white; }
            .day-item { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🇷🇼 Rwanda Travel Itinerary</h1>
            <p>Your personalized journey through the Land of a Thousand Hills</p>
          </div>
          
          <div class="summary">
            <h2>Trip Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Days</div>
                <div class="summary-value">${itinerary.length}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Start Date</div>
                <div class="summary-value">${itinerary.length > 0 ? new Date(itinerary[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">End Date</div>
                <div class="summary-value">${itinerary.length > 0 ? new Date(itinerary[itinerary.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Destinations</div>
                <div class="summary-value">${new Set(itinerary.map(i => i.destination_id)).size}</div>
              </div>
            </div>
          </div>

          <div class="itinerary">
            ${itinerary
              .map((item, index) => {
                const destination = destinations?.find((d) => d.id === item.destination_id);
                const origin = destinations?.find((d) => d.id === item.origin_id);
                const hotel = hotels?.find((h) => h.id === item.hotel_id);
                const car = cars?.find((c) => c.id === item.car_id);
                const activity = activities?.find((a) => a.id === item.activity_id);
                const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                const isTransfer = item.day_type === 'transfer';
                let distance = null;
                let travelTime = null;
                if (isTransfer && origin?.latitude && origin?.longitude && destination?.latitude && destination?.longitude) {
                  const R = 6371;
                  const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
                  const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  distance = Math.round(R * c);
                  const totalMinutes = Math.round((distance / 45) * 60);
                  travelTime = totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes/60)}h ${totalMinutes%60 > 0 ? totalMinutes%60+'min' : ''}`.trim();
                }

                return `
                <div class="day-item">
                  <div class="day-header">
                    <div>
                      <div class="day-number">Day ${index + 1}</div>
                      <div class="day-title">${isTransfer ? `${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}` : destination?.name || 'Destination'}</div>
                      <div class="day-date">📅 ${formattedDate}</div>
                      ${isTransfer && distance && travelTime ? `
                        <div style="margin-top: 8px; font-size: 0.95em; opacity: 0.95;">
                          <span style="margin-right: 15px;">📏 ${distance} km</span>
                          <span>🕐 ${travelTime}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  <div class="day-content">
                    ${isTransfer ? '<span class="transfer-badge">🚗 Transfer Day</span>' : ''}
                    
                    <div class="detail-grid">
                      ${isTransfer ? `
                        <div class="detail-item">
                          <div class="detail-label">From</div>
                          <div class="detail-value">${origin?.name || 'Not specified'}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">To</div>
                          <div class="detail-value">${destination?.name || 'Not specified'}</div>
                        </div>
                      ` : `
                        <div class="detail-item">
                          <div class="detail-label">📍 Location</div>
                          <div class="detail-value">${destination?.name || 'Not specified'}</div>
                        </div>
                      `}
                      
                      ${hotel ? `
                        <div class="detail-item">
                          <div class="detail-label">🏨 Accommodation</div>
                          <div class="detail-value">${hotel.name}</div>
                        </div>
                      ` : ''}
                      
                      ${car ? `
                        <div class="detail-item">
                          <div class="detail-label">🚙 Vehicle</div>
                          <div class="detail-value">${car.name}</div>
                        </div>
                      ` : ''}
                      
                      ${activity ? `
                        <div class="detail-item">
                          <div class="detail-label">🎯 Activity</div>
                          <div class="detail-value">${activity.name}</div>
                        </div>
                      ` : ''}
                    </div>
                    
                    ${item.notes ? `
                      <div class="notes-section">
                        <div class="notes-label">📝 Notes</div>
                        <div class="notes-text">${item.notes}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `}).join('')}
          </div>

          <div class="footer">
            <p><strong>A Click to Rwanda</strong></p>
            <p>Your journey to the Land of a Thousand Hills awaits!</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
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

  const handleSaveAndEmail = async () => {
    if (!user || itinerary.length === 0) return;
    setIsSendingEmail(true);

    try {
      // Generate text summary of itinerary
      const packageTitle = `Rwanda Itinerary - ${new Date().toLocaleDateString()}`;
      const packageContent = itinerary.map((item, index) => {
        const destination = destinations?.find((d) => d.id === item.destination_id);
        const origin = destinations?.find((d) => d.id === item.origin_id);
        const hotel = hotels?.find((h) => h.id === item.hotel_id);
        const car = cars?.find((c) => c.id === item.car_id);
        const activity = activities?.find((a) => a.id === item.activity_id);
        const isTransfer = item.day_type === 'transfer';
        const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        let dayText = `Day ${index + 1} - ${formattedDate}\n`;
        if (isTransfer) {
          dayText += `Transfer: ${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}\n`;
        } else {
          dayText += `Location: ${destination?.name || 'Not specified'}\n`;
        }
        if (hotel) dayText += `Accommodation: ${hotel.name}\n`;
        if (car) dayText += `Vehicle: ${car.name}\n`;
        if (activity) dayText += `Activity: ${activity.name}\n`;
        if (item.notes) dayText += `Notes: ${item.notes}\n`;
        dayText += `Schedule: Wake ${item.wake_time}, Breakfast ${item.breakfast_time}, Lunch ${item.lunch_time}, Dinner ${item.dinner_time}`;
        return dayText;
      }).join('\n\n---\n\n');

      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Traveler';

      await supabase.functions.invoke('send-package-email', {
        body: {
          email: user.email,
          userName,
          packageTitle,
          packageContent,
          packageType: 'itinerary',
        },
      });

      toast.success('Itinerary saved and emailed to you!');
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    } finally {
    setIsSendingEmail(false);
    }
  };

  // Save itinerary as a package
  const handleSaveAsPackage = async () => {
    if (!user || itinerary.length === 0) return;
    setIsSavingPackage(true);

    try {
      // Generate package title
      const startDate = new Date(itinerary[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endDate = new Date(itinerary[itinerary.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const packageTitle = `Rwanda Trip: ${startDate} - ${endDate}`;

      // Build conversation history format that matches AI Planner
      const conversationHistory = itinerary.map((item, index) => {
        const destination = destinations?.find((d) => d.id === item.destination_id);
        const origin = destinations?.find((d) => d.id === item.origin_id);
        const hotel = hotels?.find((h) => h.id === item.hotel_id);
        const car = cars?.find((c) => c.id === item.car_id);
        const activity = activities?.find((a) => a.id === item.activity_id);
        const isTransfer = item.day_type === 'transfer';
        const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        let content = `Day ${index + 1}: ${formattedDate}\n`;
        if (isTransfer) {
          content += `📍 Transfer: ${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}\n`;
        } else {
          content += `📍 Destination: ${destination?.name || 'Not specified'}\n`;
        }
        if (hotel) content += `🏨 Hotel: ${hotel.name}${item.hotel_cost ? ` - $${item.hotel_cost}` : ''}\n`;
        if (activity) content += `🎯 Activity: ${activity.name}${item.activity_cost ? ` - $${item.activity_cost}` : ''}\n`;
        if (car) content += `🚗 Vehicle: ${car.name}${item.car_cost ? ` - $${item.car_cost}/day` : ''}\n`;
        if (item.transport_cost) content += `⛽ Transport: $${item.transport_cost}\n`;
        if (item.other_cost) content += `📦 Other: $${item.other_cost}\n`;
        if (item.notes) content += `📝 Notes: ${item.notes}\n`;

        const dayCost = (Number(item.hotel_cost) || 0) + (Number(item.activity_cost) || 0) + 
                        (Number(item.car_cost) || 0) + (Number(item.transport_cost) || 0) + (Number(item.other_cost) || 0);
        if (dayCost > 0) content += `💰 Day Total: $${dayCost.toFixed(2)}`;

        return { role: 'assistant' as const, content };
      });

      // Add summary message
      if (grandTotal > 0) {
        conversationHistory.push({
          role: 'assistant' as const,
          content: `═══════════════════════════════════════
💵 TOTAL PACKAGE COST
═══════════════════════════════════════

🏨 Accommodation: $${totalCosts.hotel.toFixed(2)}
🎯 Activities: $${totalCosts.activity.toFixed(2)}
🚗 Car Rental: $${totalCosts.car.toFixed(2)}
⛽ Transport: $${totalCosts.transport.toFixed(2)}
📦 Other: $${totalCosts.other.toFixed(2)}

💰 GRAND TOTAL: $${grandTotal.toFixed(2)}

${itinerary.length} days | ${new Set(itinerary.map(i => i.destination_id)).size} destinations`
        });
      }

      // Save to database
      const { error } = await supabase.from('saved_tour_packages').insert({
        user_id: user.id,
        title: packageTitle,
        conversation_history: conversationHistory,
      });

      if (error) throw error;

      // Send email notification
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Traveler';
      const packageContent = conversationHistory.map(m => m.content).join('\n\n---\n\n');

      await supabase.functions.invoke('send-package-email', {
        body: {
          email: user.email,
          userName,
          packageTitle,
          packageContent,
          packageType: 'itinerary',
        },
      });

      toast.success('Package saved and emailed! View it in your Profile.');
    } catch (error) {
      console.error('Save package error:', error);
      toast.error('Failed to save package');
    } finally {
      setIsSavingPackage(false);
    }
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

        {/* Day Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Day Type</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="regular"
                checked={dayType === 'regular'}
                onChange={(e) => setDayType(e.target.value as 'regular')}
                className="mr-2"
              />
              <span>Regular Day</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="transfer"
                checked={dayType === 'transfer'}
                onChange={(e) => setDayType(e.target.value as 'transfer')}
                className="mr-2"
              />
              <span>Transfer Day</span>
            </label>
          </div>
        </div>

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

          {dayType === 'transfer' && (
            <div>
              <label className="block text-sm font-medium mb-2">Origin *</label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">-- Choose origin --</option>
                {destinations?.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {dayType === 'transfer' ? 'Destination *' : 'Destination *'}
            </label>
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

          {/* Hotel selection - shown for both regular and transfer days */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hotel {dayType === 'transfer' ? '(at destination)' : ''} 
              {itinerary.length > 0 && itinerary[itinerary.length - 1].destination_id === selectedDestination && ' (or same as previous)'}
            </label>
            {dayType === 'regular' && itinerary.length > 0 && itinerary[itinerary.length - 1].destination_id === selectedDestination && (
              <div className="mb-2">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSameHotel}
                    onChange={(e) => {
                      setUseSameHotel(e.target.checked);
                      if (e.target.checked) setSelectedHotel('');
                    }}
                    className="mr-2"
                  />
                  <span>Same hotel as Day {itinerary.length}</span>
                </label>
              </div>
            )}
            <select
              value={selectedHotel}
              onChange={(e) => {
                setSelectedHotel(e.target.value);
                setUseSameHotel(false);
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={!selectedDestination || useSameHotel}
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

          {dayType === 'regular' && (
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
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Car {itinerary.length === 0 ? '*' : '(or same as previous)'}
            </label>
            {itinerary.length > 0 && (
              <div className="mb-2">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSameCar}
                    onChange={(e) => {
                      setUseSameCar(e.target.checked);
                      if (e.target.checked) setSelectedCar('');
                    }}
                    className="mr-2"
                  />
                  <span>Same car as Day {itinerary.length}</span>
                </label>
              </div>
            )}
            <select
              value={selectedCar}
              onChange={(e) => {
                setSelectedCar(e.target.value);
                setUseSameCar(false);
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={useSameCar}
              required={itinerary.length === 0}
            >
              <option value="">-- Choose car --</option>
              {cars?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
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

        {/* Daily Schedule Times */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <Bell size={18} className="mr-2" /> Daily Schedule
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Wake Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Breakfast</label>
              <input
                type="time"
                value={breakfastTime}
                onChange={(e) => setBreakfastTime(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lunch</label>
              <input
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Dinner</label>
              <input
                type="time"
                value={dinnerTime}
                onChange={(e) => setDinnerTime(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => addMutation.mutate()} 
          disabled={
            !selectedDate || 
            (dayType === 'transfer' && (!selectedOrigin || !selectedDestination)) ||
            (dayType === 'regular' && !selectedDestination) ||
            (itinerary.length === 0 && !selectedCar && !useSameCar)
          }
          className="mt-4 w-full md:w-auto"
        >
          <Plus size={20} className="mr-2" /> Add Day
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-2xl font-bold flex items-center">
            <BookOpen size={24} className="mr-2" /> My Itinerary
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowCostInputs(!showCostInputs)}
              variant={showCostInputs ? "default" : "outline"}
              size="sm"
            >
              <DollarSign size={18} className="mr-2" />
              {showCostInputs ? 'Hide Costs' : 'Add Costs'}
            </Button>
            <Button
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
              disabled={testingNotification}
            >
              <Bell size={18} className="mr-2" />
              {testingNotification ? 'Sending...' : notificationsEnabled ? 'Test Notification' : 'Enable Notifications'}
            </Button>
            {itinerary.length > 0 && (
              <>
                <Button 
                  onClick={() => {
                    if (notificationsEnabled) {
                      const notifications = scheduleItineraryNotifications(itinerary, destinations || []);
                      saveScheduledNotifications(notifications);
                      toast.success('Itinerary saved with notifications scheduled!');
                    } else {
                      toast.info('Enable notifications to receive reminders');
                    }
                    handleDownload();
                  }}
                  variant="outline"
                >
                  <Download size={20} className="mr-2" /> Download
                </Button>
                <Button 
                  onClick={handleSaveAndEmail}
                  disabled={isSendingEmail}
                  variant="outline"
                >
                  {isSendingEmail ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <Mail size={20} className="mr-2" />
                  )}
                  {isSendingEmail ? 'Sending...' : 'Email'}
                </Button>
              </>
            )}
          </div>
        </div>

        {itinerary.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Your itinerary is empty. Add days above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {itinerary.map((item, index) => {
              const destination = destinations?.find((d) => d.id === item.destination_id);
              const origin = destinations?.find((d) => d.id === item.origin_id);
              const hotel = hotels?.find((h) => h.id === item.hotel_id);
              const car = cars?.find((c) => c.id === item.car_id);
              const activity = activities?.find((a) => a.id === item.activity_id);
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              const isTransfer = item.day_type === 'transfer';

              // Calculate distance and travel time for transfer days
              let distance: number | null = null;
              let travelTime: string | null = null;
              if (isTransfer && origin?.latitude && origin?.longitude && destination?.latitude && destination?.longitude) {
                distance = calculateDistance(
                  origin.latitude,
                  origin.longitude,
                  destination.latitude,
                  destination.longitude
                );
                travelTime = estimateTravelTime(distance);
              }

              return (
                <div key={item.id} className="border border-border rounded-lg p-5 bg-background/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground font-medium">Day {index + 1}</div>
                      {isTransfer && (
                        <span className="inline-block bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium mb-1">
                          Transfer
                        </span>
                      )}
                      <h4 className="text-2xl font-bold text-primary">
                        {isTransfer ? `${origin?.name || 'Origin'} → ${destination?.name || 'Destination'}` : destination?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Calendar size={14} className="inline mr-1" />
                        {formattedDate}
                      </p>
                      {isTransfer && distance && travelTime && (
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-primary font-medium">
                            📏 {formatDistance(distance)}
                          </span>
                          <span className="text-primary font-medium">
                            🕐 {travelTime}
                          </span>
                        </div>
                      )}
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
                    
                    {/* Hotel selection - available for both regular and transfer days */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Hotel {isTransfer ? '(at destination)' : ''}
                      </label>
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

                    {!isTransfer && (
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
                    )}

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Car</label>
                      <select
                        value={item.car_id || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: item.id,
                            field: 'car_id',
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      >
                        <option value="">Not selected</option>
                        {cars?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {hotel && (
                    <div className="flex items-center justify-between text-sm mb-2 p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBookingStatus(item.id, 'hotel_booked', item.hotel_booked || false)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.hotel_booked 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground hover:border-primary'
                          }`}
                        >
                          {item.hotel_booked && <Check size={12} />}
                        </button>
                        <Hotel size={16} className="text-muted-foreground" />
                        <span className={item.hotel_booked ? 'line-through text-muted-foreground' : ''}>
                          {hotel.name}
                        </span>
                        {item.hotel_booked && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Booked</span>
                        )}
                      </div>
                      {(HOTEL_BOOKING_URLS[item.hotel_id || ''] || getBookingUrl(item.destination_id, 'hotel', item.hotel_id)) && !item.hotel_booked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getBookingUrl(item.destination_id, 'hotel', item.hotel_id)!, '_blank')}
                          className="ml-2"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Book Hotel
                        </Button>
                      )}
                    </div>
                  )}

                  {car && (
                    <div className="flex items-center gap-2 text-sm mb-2 p-2 rounded-md bg-muted/30">
                      <Car size={16} className="text-muted-foreground" />
                      <span className="font-medium">Vehicle:</span> {car.name}
                    </div>
                  )}
                  
                  {activity && (
                    <div className="flex items-center justify-between text-sm mb-2 p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBookingStatus(item.id, 'activity_booked', item.activity_booked || false)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.activity_booked 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground hover:border-primary'
                          }`}
                        >
                          {item.activity_booked && <Check size={12} />}
                        </button>
                        <MapPin size={16} className="text-muted-foreground" />
                        <span className={item.activity_booked ? 'line-through text-muted-foreground' : ''}>
                          {activity.name}
                        </span>
                        {item.activity_booked && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Booked</span>
                        )}
                      </div>
                      {getBookingUrl(item.destination_id, 'destination') && !item.activity_booked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getBookingUrl(item.destination_id, 'destination')!, '_blank')}
                          className="ml-2"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Book Activity
                        </Button>
                      )}
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

                  {/* Cost Inputs - Show when enabled */}
                  {showCostInputs && (
                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <h5 className="text-sm font-semibold mb-3 flex items-center text-emerald-700 dark:text-emerald-300">
                        <DollarSign size={16} className="mr-1" /> Day {index + 1} Costs (USD)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {hotel && (
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Hotel</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.hotel_cost || ''}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: item.id,
                                  field: 'hotel_cost',
                                  value: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        {activity && (
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Activity</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.activity_cost || ''}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: item.id,
                                  field: 'activity_cost',
                                  value: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        {car && (
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Car/Day</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.car_cost || ''}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: item.id,
                                  field: 'car_cost',
                                  value: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Transport</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.transport_cost || ''}
                            onChange={(e) =>
                              updateMutation.mutate({
                                id: item.id,
                                field: 'transport_cost',
                                value: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Other</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.other_cost || ''}
                            onChange={(e) =>
                              updateMutation.mutate({
                                id: item.id,
                                field: 'other_cost',
                                value: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      {/* Day total */}
                      <div className="mt-2 text-right text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Day Total: ${((Number(item.hotel_cost) || 0) + (Number(item.activity_cost) || 0) + 
                          (Number(item.car_cost) || 0) + (Number(item.transport_cost) || 0) + (Number(item.other_cost) || 0)).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Summary & Confirmation Section */}
      {itinerary.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <CheckCircle2 size={24} className="mr-2 text-primary" /> Booking Summary & Confirmation
          </h3>

          {allConfirmed ? (
            <div className="text-center py-8 bg-primary/10 rounded-lg border-2 border-primary">
              <CheckCircle2 size={64} className="mx-auto text-primary mb-4" />
              <h4 className="text-2xl font-bold text-primary mb-2">All Bookings Confirmed!</h4>
              <p className="text-muted-foreground">Your Rwanda adventure is fully booked and ready to go.</p>
            </div>
          ) : (
            <>
              {/* Car Rental Section - Once per itinerary */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Car size={20} className="mr-2" /> Car Rental (Book Once for Entire Trip)
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your selected vehicle: <strong>{cars?.find(c => itinerary.some(i => i.car_id === c.id))?.name || 'Not selected'}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAR_BOOKING_URLS.map((rental) => (
                    <Button
                      key={rental.name}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(rental.url, '_blank')}
                    >
                      <ExternalLink size={14} className="mr-1" />
                      {rental.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Cost Summary - Show when costs have been added */}
              {grandTotal > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-2 border-emerald-500">
                  <h4 className="font-semibold mb-4 flex items-center text-emerald-700 dark:text-emerald-300">
                    <DollarSign size={20} className="mr-2" /> Total Trip Cost
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {totalCosts.hotel > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">🏨 Hotels</div>
                        <div className="text-lg font-bold text-primary">${totalCosts.hotel.toFixed(2)}</div>
                      </div>
                    )}
                    {totalCosts.activity > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">🎯 Activities</div>
                        <div className="text-lg font-bold text-primary">${totalCosts.activity.toFixed(2)}</div>
                      </div>
                    )}
                    {totalCosts.car > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">🚗 Car Rental</div>
                        <div className="text-lg font-bold text-primary">${totalCosts.car.toFixed(2)}</div>
                      </div>
                    )}
                    {totalCosts.transport > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">⛽ Transport</div>
                        <div className="text-lg font-bold text-primary">${totalCosts.transport.toFixed(2)}</div>
                      </div>
                    )}
                    {totalCosts.other > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">📦 Other</div>
                        <div className="text-lg font-bold text-primary">${totalCosts.other.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Grand Total</div>
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                      ${grandTotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {itinerary.length} days • ${(grandTotal / itinerary.length).toFixed(2)}/day average
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Progress */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Booking Progress</h4>
                <div className="space-y-2">
                  {itinerary.map((item, index) => {
                    const destination = destinations?.find(d => d.id === item.destination_id);
                    const hotel = hotels?.find(h => h.id === item.hotel_id);
                    const activity = activities?.find(a => a.id === item.activity_id);
                    const dayCost = (Number(item.hotel_cost) || 0) + (Number(item.activity_cost) || 0) + 
                                    (Number(item.car_cost) || 0) + (Number(item.transport_cost) || 0) + (Number(item.other_cost) || 0);
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">Day {index + 1}:</span>
                          <span className="text-sm text-muted-foreground">{destination?.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {dayCost > 0 && (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              ${dayCost.toFixed(2)}
                            </span>
                          )}
                          {hotel && (
                            <div className="flex items-center gap-1 text-sm">
                              <Hotel size={14} />
                              {item.hotel_booked ? (
                                <span className="text-primary">✓ Booked</span>
                              ) : (
                                <span className="text-amber-500">Pending</span>
                              )}
                            </div>
                          )}
                          {activity && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin size={14} />
                              {item.activity_booked ? (
                                <span className="text-primary">✓ Booked</span>
                              ) : (
                                <span className="text-amber-500">Pending</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center pt-4 border-t border-border space-y-4">
                {allItemsBooked ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" onClick={confirmAllBookings} className="px-8">
                      <CheckCircle2 size={20} className="mr-2" />
                      Confirm All Bookings
                    </Button>
                    {grandTotal > 0 && (
                      <Button 
                        size="lg" 
                        onClick={handleSaveAsPackage}
                        disabled={isSavingPackage}
                        variant="outline"
                        className="px-8 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                      >
                        {isSavingPackage ? (
                          <Loader2 size={20} className="mr-2 animate-spin" />
                        ) : (
                          <Package size={20} className="mr-2" />
                        )}
                        {isSavingPackage ? 'Saving...' : 'Save as Package'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Complete all bookings and add costs, then save as a package.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button size="lg" disabled className="px-8">
                        <CheckCircle2 size={20} className="mr-2" />
                        Confirm All Bookings
                      </Button>
                      {grandTotal > 0 && (
                        <Button 
                          size="lg" 
                          onClick={handleSaveAsPackage}
                          disabled={isSavingPackage}
                          variant="outline"
                          className="px-8 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                        >
                          {isSavingPackage ? (
                            <Loader2 size={20} className="mr-2 animate-spin" />
                          ) : (
                            <Package size={20} className="mr-2" />
                          )}
                          {isSavingPackage ? 'Saving...' : 'Save as Package'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeIndependent;
