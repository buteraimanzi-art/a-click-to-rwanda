import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Hotel, MapPin, Car, DollarSign } from 'lucide-react';

interface ItineraryItem {
  id: string;
  destination_id: string;
  hotel_id: string | null;
  activity_id: string | null;
  car_id: string | null;
  hotel_booked: boolean | null;
  activity_booked: boolean | null;
  hotel_cost: number | null;
  activity_cost: number | null;
  car_cost: number | null;
  transport_cost: number | null;
  other_cost: number | null;
}

interface ItineraryProgressProps {
  itinerary: ItineraryItem[];
}

export const ItineraryProgress = ({ itinerary }: ItineraryProgressProps) => {
  const progress = useMemo(() => {
    if (itinerary.length === 0) return { percentage: 0, details: { hotels: 0, activities: 0, costs: 0 } };

    let totalItems = 0;
    let completedItems = 0;

    // Count hotels
    const daysWithHotels = itinerary.filter(i => i.hotel_id);
    const bookedHotels = itinerary.filter(i => i.hotel_id && i.hotel_booked);
    totalItems += daysWithHotels.length;
    completedItems += bookedHotels.length;

    // Count activities
    const daysWithActivities = itinerary.filter(i => i.activity_id);
    const bookedActivities = itinerary.filter(i => i.activity_id && i.activity_booked);
    totalItems += daysWithActivities.length;
    completedItems += bookedActivities.length;

    // Count costs added
    const daysWithCosts = itinerary.filter(i => 
      (Number(i.hotel_cost) || 0) > 0 ||
      (Number(i.activity_cost) || 0) > 0 ||
      (Number(i.car_cost) || 0) > 0 ||
      (Number(i.transport_cost) || 0) > 0 ||
      (Number(i.other_cost) || 0) > 0
    );
    totalItems += itinerary.length; // Each day should have costs
    completedItems += daysWithCosts.length;

    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      percentage,
      details: {
        hotels: daysWithHotels.length > 0 ? Math.round((bookedHotels.length / daysWithHotels.length) * 100) : 100,
        activities: daysWithActivities.length > 0 ? Math.round((bookedActivities.length / daysWithActivities.length) * 100) : 100,
        costs: Math.round((daysWithCosts.length / itinerary.length) * 100),
      }
    };
  }, [itinerary]);

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />;
    return <Circle size={16} className="text-muted-foreground" />;
  };

  if (itinerary.length === 0) return null;

  return (
    <div className="bg-card rounded-lg shadow-lg p-5 mb-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-lg">Itinerary Progress</h4>
        <span className={`text-2xl font-bold ${getStatusColor(progress.percentage)}`}>
          {progress.percentage}%
        </span>
      </div>
      
      <Progress value={progress.percentage} className="h-3 mb-4" />
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          {getStatusIcon(progress.details.hotels)}
          <Hotel size={16} className="text-muted-foreground" />
          <div>
            <div className={getStatusColor(progress.details.hotels)}>
              Hotels {progress.details.hotels}%
            </div>
            <div className="text-xs text-muted-foreground">
              {progress.details.hotels === 100 ? 'All booked' : 'Pending'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(progress.details.activities)}
          <MapPin size={16} className="text-muted-foreground" />
          <div>
            <div className={getStatusColor(progress.details.activities)}>
              Activities {progress.details.activities}%
            </div>
            <div className="text-xs text-muted-foreground">
              {progress.details.activities === 100 ? 'All booked' : 'Pending'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(progress.details.costs)}
          <DollarSign size={16} className="text-muted-foreground" />
          <div>
            <div className={getStatusColor(progress.details.costs)}>
              Costs {progress.details.costs}%
            </div>
            <div className="text-xs text-muted-foreground">
              {progress.details.costs === 100 ? 'All added' : 'Missing'}
            </div>
          </div>
        </div>
      </div>

      {progress.percentage < 100 && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            💡 <strong>Tip:</strong> Complete all bookings and add costs to save as a package!
          </p>
        </div>
      )}
    </div>
  );
};
