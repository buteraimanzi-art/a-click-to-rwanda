import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Reviews = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDestination, setSelectedDestination] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDestination || !comment.trim()) throw new Error('Missing data');
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        destination_id: selectedDestination,
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedDestination('');
      setRating(5);
      setComment('');
      toast.success('Review submitted successfully!');
    },
    onError: () => toast.error('Failed to submit review'),
  });

  return (
    <div className="max-w-7xl mx-auto p-8 pt-20">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-accent text-accent-foreground p-4 rounded-full">
            <MessageSquare size={48} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-primary mb-4">Traveler Reviews</h2>
        <p className="text-lg text-muted-foreground">
          Hear from travelers who have experienced the magic of Rwanda
        </p>
      </div>

      {user && (
        <div className="bg-card rounded-lg shadow-lg p-6 mb-12">
          <h3 className="text-2xl font-bold mb-4">Share Your Experience</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium mb-2">
                Select Destination
              </label>
              <select
                id="destination"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">-- Choose a destination --</option>
                {destinations?.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= rating
                          ? 'fill-accent text-accent'
                          : 'text-muted stroke-muted-foreground'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2">
                Your Review
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-md bg-background min-h-[120px]"
                placeholder="Share your experience..."
              />
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!selectedDestination || !comment.trim() || submitMutation.isPending}
            >
              <Send size={20} className="mr-2" />
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-muted rounded-lg p-6 mb-12 text-center">
          <p className="text-muted-foreground mb-4">Want to share your experience?</p>
          <Button onClick={() => navigate('/login')} variant="outline">
            Log in to leave a review
          </Button>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Recent Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">
                    {destinations?.find((d) => d.id === review.destination_id)?.name ||
                      review.destination_id}
                  </h4>
                  <div className="flex items-center space-x-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < review.rating
                            ? 'fill-accent text-accent'
                            : 'text-muted stroke-muted-foreground'
                        }
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
