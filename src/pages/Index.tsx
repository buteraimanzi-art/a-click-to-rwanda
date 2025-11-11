import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-rwanda.jpg';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*');
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <section className="relative h-[80vh] flex items-center justify-center text-white text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-4 max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Welcome to the Heart of Africa
          </h2>
          <p className="mt-4 text-xl md:text-2xl font-light">
            Explore the land of a thousand hills with 'A CLICK TO RWANDA'
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => navigate('/free-independent')}
              size="lg"
              className="bg-hero hover:bg-hero/90 text-hero-foreground"
            >
              Start Planning
            </Button>
            <Button
              onClick={() => navigate('/exclusive')}
              variant="secondary"
              size="lg"
            >
              Exclusive Tour
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Destinations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations?.map((dest) => (
              <div
                key={dest.id}
                className="relative rounded-lg shadow-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={`https://placehold.co/600x400/145833/ffffff?text=${encodeURIComponent(dest.name)}`}
                  alt={dest.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white z-10">
                  <h4 className="text-xl font-bold">{dest.name}</h4>
                  <p className="mt-1 text-sm">{dest.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-16 px-4 md:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold">Plan Your Perfect Trip</h3>
          <p className="mt-4 text-lg font-light">
            With our user-friendly tools, you can create a personalized itinerary that matches
            your dreams.
          </p>
          <Button
            onClick={() => navigate('/free-independent')}
            className="mt-8 bg-background text-foreground hover:bg-background/90"
            size="lg"
          >
            Start Your Journey
          </Button>
        </div>
      </section>
    </>
  );
};

export default Index;
