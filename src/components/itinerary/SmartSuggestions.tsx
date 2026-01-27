import { useMemo } from 'react';
import { Lightbulb, Hotel, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Destination {
  id: string;
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface HotelType {
  id: string;
  name: string;
  destination_id: string;
}

interface Activity {
  id: string;
  name: string;
  destination_id: string;
}

interface SmartSuggestionsProps {
  selectedDestination: string;
  destinations: Destination[] | undefined;
  hotels: HotelType[] | undefined;
  activities: Activity[] | undefined;
  onSelectHotel: (hotelId: string) => void;
  onSelectActivity: (activityId: string) => void;
}

// Popular combinations based on common travel patterns
const DESTINATION_COMBOS: Record<string, { recommended: string[]; reason: string }> = {
  'volcanoes': {
    recommended: ['musanze', 'kigali'],
    reason: 'Gorilla trekking pairs well with Musanze town and Kigali cultural sites'
  },
  'musanze': {
    recommended: ['volcanoes', 'lake-kivu'],
    reason: 'After Musanze, visit nearby Volcanoes NP or relax at Lake Kivu'
  },
  'akagera': {
    recommended: ['kigali', 'nyungwe'],
    reason: 'Safari lovers often combine Akagera with Nyungwe for diverse wildlife'
  },
  'nyungwe': {
    recommended: ['lake-kivu', 'akagera'],
    reason: 'Nyungwe chimps + Lake Kivu views make a perfect combo'
  },
  'lake-kivu': {
    recommended: ['nyungwe', 'musanze'],
    reason: 'Lake relaxation pairs great with forest trekking'
  },
  'kigali': {
    recommended: ['campaign-genocide', 'kandt-house', 'volcanoes'],
    reason: 'Start with Kigali museums before heading to national parks'
  },
};

export const SmartSuggestions = ({
  selectedDestination,
  destinations,
  hotels,
  activities,
  onSelectHotel,
  onSelectActivity,
}: SmartSuggestionsProps) => {
  const suggestions = useMemo(() => {
    if (!selectedDestination) return null;

    const destHotels = hotels?.filter(h => h.destination_id === selectedDestination) || [];
    const destActivities = activities?.filter(a => a.destination_id === selectedDestination) || [];
    const combo = DESTINATION_COMBOS[selectedDestination.toLowerCase()];

    // Get top recommended hotels (max 2)
    const topHotels = destHotels.slice(0, 2);
    
    // Get top activities (max 3)
    const topActivities = destActivities.slice(0, 3);

    // Get next destination suggestions
    const nextDestinations = combo?.recommended
      .map(id => destinations?.find(d => d.id.toLowerCase() === id))
      .filter(Boolean) || [];

    return {
      hotels: topHotels,
      activities: topActivities,
      nextDestinations,
      reason: combo?.reason || 'Popular choices for this destination',
    };
  }, [selectedDestination, hotels, activities, destinations]);

  if (!selectedDestination || !suggestions) {
    return null;
  }

  const hasContent = suggestions.hotels.length > 0 || suggestions.activities.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-primary" />
        <h4 className="font-semibold text-primary">Smart Suggestions</h4>
      </div>

      {suggestions.hotels.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Hotel size={12} /> Recommended Hotels
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.hotels.map((hotel) => (
              <Button
                key={hotel.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectHotel(hotel.id)}
                className="text-xs hover:bg-primary hover:text-primary-foreground"
              >
                <Star size={12} className="mr-1" />
                {hotel.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {suggestions.activities.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin size={12} /> Popular Activities
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.activities.map((activity) => (
              <Button
                key={activity.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectActivity(activity.id)}
                className="text-xs hover:bg-primary hover:text-primary-foreground"
              >
                {activity.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {suggestions.nextDestinations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">
            💡 {suggestions.reason}
          </p>
          <p className="text-xs text-primary font-medium">
            Consider next: {suggestions.nextDestinations.map(d => d?.name).join(' → ')}
          </p>
        </div>
      )}
    </div>
  );
};
