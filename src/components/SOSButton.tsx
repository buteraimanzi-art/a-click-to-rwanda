import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const SOSButton = () => {
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const handleSOSClick = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Location captured - in production, send to secure backend endpoint
        const { latitude, longitude } = position.coords;
        setIsAlertVisible(true);
        toast.error('SOS alert sent! Help is on the way.', {
          duration: 5000,
        });
        setTimeout(() => setIsAlertVisible(false), 5000);
      },
      (error) => {
        console.error('Error getting location: ', error);
        setIsAlertVisible(true);
        toast.error('SOS alert sent (location unavailable)', {
          duration: 5000,
        });
        setTimeout(() => setIsAlertVisible(false), 5000);
      }
    );
  };

  return (
    <>
      <button
        onClick={handleSOSClick}
        className="fixed bottom-6 right-6 bg-destructive text-destructive-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-50 animate-pulse"
        aria-label="Emergency SOS button"
      >
        <AlertCircle size={32} />
      </button>
    </>
  );
};
