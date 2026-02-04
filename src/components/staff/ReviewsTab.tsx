import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Trash2, RefreshCw } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  destination_id: string;
  rating: number;
  comment: string;
  display_name: string | null;
  created_at: string;
}

interface ReviewsTabProps {
  reviews: Review[];
  onRefresh: () => void;
}

const ReviewsTab = ({ reviews, onRefresh }: ReviewsTabProps) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    setIsDeleting(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Review deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Review Management</CardTitle>
          <CardDescription>Moderate user reviews</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{review.display_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">
                      Destination: {review.destination_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReview(review.id)}
                      disabled={isDeleting === review.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsTab;
