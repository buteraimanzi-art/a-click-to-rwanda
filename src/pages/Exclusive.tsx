import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Exclusive = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !message.trim()) throw new Error('Missing data');
      const { error } = await supabase.from('custom_requests').insert({
        user_id: user.id,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Your exclusive tour request has been submitted!');
      setMessage('');
    },
    onError: () => toast.error('Failed to submit request'),
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-8 pt-20 text-center">
        <h2 className="text-4xl font-bold text-primary mb-4">Please Log In</h2>
        <p className="text-lg text-muted-foreground mb-8">
          You need to be logged in to request an exclusive tour.
        </p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 pt-20">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-accent text-accent-foreground p-4 rounded-full">
            <Sparkles size={48} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-primary mb-4">Exclusive Custom Tours</h2>
        <p className="text-lg text-muted-foreground">
          Let us create a bespoke Rwanda experience tailored just for you. Share your dream
          itinerary, and our team will make it happen.
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-4">Tell Us About Your Dream Trip</h3>
        <p className="text-muted-foreground mb-6">
          Describe your ideal Rwanda adventure. Include details like preferred activities,
          accommodation style, budget, travel dates, and any special requests.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Your Custom Request
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-md bg-background min-h-[200px]"
              placeholder="Example: I would like a 5-day luxury gorilla trekking and wildlife safari experience for 2 people. We prefer boutique hotels and are interested in cultural experiences..."
            />
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!message.trim() || submitMutation.isPending}
            size="lg"
            className="w-full"
          >
            <Send size={20} className="mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">What Happens Next?</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Our travel experts will review your request within 24 hours</li>
            <li>• We will create a personalized itinerary based on your preferences</li>
            <li>• You will receive a detailed proposal with pricing</li>
            <li>• We will work together to perfect every detail of your journey</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Exclusive;
