import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';

interface Itinerary {
  id: string;
  user_id: string;
  destination_id: string;
  date: string;
  is_booked: boolean;
  hotel_booked: boolean;
  activity_booked: boolean;
  all_confirmed: boolean;
  hotel_cost: number | null;
  activity_cost: number | null;
  car_cost: number | null;
}

interface ItinerariesTabProps {
  itineraries: Itinerary[];
  onRefresh: () => void;
}

const ItinerariesTab = ({ itineraries, onRefresh }: ItinerariesTabProps) => {
  const calculateTotalCost = (itin: Itinerary) => {
    const hotel = itin.hotel_cost || 0;
    const activity = itin.activity_cost || 0;
    const car = itin.car_cost || 0;
    return hotel + activity + car;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Itinerary Overview</CardTitle>
          <CardDescription>User trip plans and bookings</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {itineraries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No itineraries yet</p>
        ) : (
          <div className="space-y-4">
            {itineraries.map((itin) => (
              <div 
                key={itin.id} 
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{itin.destination_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(itin.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      User: {itin.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${calculateTotalCost(itin).toFixed(2)}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {itin.hotel_booked && (
                        <Badge variant="outline" className="text-xs">Hotel</Badge>
                      )}
                      {itin.activity_booked && (
                        <Badge variant="outline" className="text-xs">Activity</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={itin.is_booked ? 'default' : 'secondary'}>
                    {itin.all_confirmed ? 'Confirmed' : itin.is_booked ? 'Booked' : 'Planned'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItinerariesTab;
