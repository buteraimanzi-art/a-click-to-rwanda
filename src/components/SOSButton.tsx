import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const SOSButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendSOSAlert = async (latitude: number | null, longitude: number | null, locationAvailable: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to use the emergency SOS feature');
        return;
      }

      const response = await supabase.functions.invoke('send-sos-alert', {
        body: { latitude, longitude, locationAvailable }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('🚨 SOS alert sent! Click to Rwanda has been notified and will contact you shortly.', {
        duration: 8000,
      });
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      toast.error('Failed to send SOS alert. Please try calling emergency services directly.');
    }
  };

  const handleSOSClick = async () => {
    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await sendSOSAlert(latitude, longitude, true);
        setIsLoading(false);
      },
      async (error) => {
        console.error('Error getting location:', error);
        // Still send alert even without location
        await sendSOSAlert(null, null, false);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      onClick={handleSOSClick}
      disabled={isLoading}
      className="fixed bottom-6 right-6 bg-destructive text-destructive-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-50 animate-pulse disabled:animate-none disabled:opacity-80"
      aria-label="Emergency SOS button"
    >
      {isLoading ? <Loader2 size={32} className="animate-spin" /> : <AlertCircle size={32} />}
    </button>
  );
};
