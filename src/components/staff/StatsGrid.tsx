import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Star, Calendar } from 'lucide-react';

interface StatsGridProps {
  totalUsers: number;
  activeSubscriptions: number;
  totalReviews: number;
  totalItineraries: number;
}

const StatsGrid = ({ totalUsers, activeSubscriptions, totalReviews, totalItineraries }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Subscriptions
          </CardTitle>
          <Users className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {activeSubscriptions} active
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
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            ${activeSubscriptions * 50} revenue
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
          <div className="text-2xl font-bold">{totalReviews}</div>
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
          <div className="text-2xl font-bold">{totalItineraries}</div>
          <p className="text-xs text-muted-foreground">Trip plans created</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsGrid;
