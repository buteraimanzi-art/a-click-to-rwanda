import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import heroImage from '@/assets/hero-rwanda.jpg';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from 'lucide-react';

// Import destination images
import akageraImg from '@/assets/destinations/akagera-national-park.jpg';
import campaignMuseumImg from '@/assets/destinations/campaign-against-genocide-museum.jpg';
import ethnographicImg from '@/assets/destinations/ethnographic-museum.jpg';
import kandtHouseImg from '@/assets/destinations/kandt-house-museum.jpg';
import kigaliImg from '@/assets/destinations/kigali.jpg';
import kingsPalaceImg from '@/assets/destinations/kings-palace-museum.jpg';
import lakeKivuImg from '@/assets/destinations/lake-kivu.jpg';
import musanzeImg from '@/assets/destinations/musanze.jpg';
import nyungweImg from '@/assets/destinations/nyungwe-national-park.jpg';
import rwandaArtImg from '@/assets/destinations/rwanda-art-museum.jpg';

// Map destination IDs to their images
const destinationImages: Record<string, string> = {
  'akagera': akageraImg,
  'liberation': campaignMuseumImg,
  'ethnographic': ethnographicImg,
  'kandt-house': kandtHouseImg,
  'kigali': kigaliImg,
  'kings-palace': kingsPalaceImg,
  'lake-kivu': lakeKivuImg,
  'musanze': musanzeImg,
  'nyungwe': nyungweImg,
  'art-gallery': rwandaArtImg,
};

const heroSlides = [
  {
    title: "Welcome to the Heart of Africa",
    subtitle: "Explore the land of a thousand hills with 'A CLICK TO RWANDA'"
  },
  {
    title: "Plan Your Perfect Journey",
    subtitle: "Create personalized itineraries with our AI-powered travel planner"
  },
  {
    title: "Discover Hidden Gems",
    subtitle: "From gorilla trekking to serene lakes, experience Rwanda's natural wonders"
  },
  {
    title: "Book With Confidence",
    subtitle: "Trusted local partners, verified accommodations, and 24/7 support"
  },
  {
    title: "Your Adventure Awaits",
    subtitle: "One platform for hotels, activities, transport, and exclusive tours"
  },
  {
    title: "Plan Your Dream Itinerary",
    subtitle: "Use our smart planner to build day-by-day travel plans tailored to your interests"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        setIsAnimating(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
      <section className="relative h-[80vh] flex items-center justify-center text-white text-center overflow-hidden">
        {/* Hero Background Image */}
        <img
          src={heroImage}
          alt="Rwanda landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-4 max-w-4xl">
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-4 animate-fade-in">
              {heroSlides[currentSlide].title}
            </h2>
            <p className="mt-4 text-xl md:text-2xl font-light">
              {heroSlides[currentSlide].subtitle}
            </p>
          </div>
          
          {/* Slide indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentSlide(index);
                    setIsAnimating(false);
                  }, 300);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
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
                  src={destinationImages[dest.id] || `https://placehold.co/600x400/145833/ffffff?text=${encodeURIComponent(dest.name)}`}
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

      {/* Pricing Plans Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose Your Plan</h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explore Rwanda your way — browse for free or unlock direct bookings with our Annual plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
              <h4 className="text-2xl font-bold text-card-foreground">Free</h4>
              <p className="text-muted-foreground mt-2 text-sm">Perfect for exploring and planning</p>
              <div className="mt-6 mb-8">
                <span className="text-4xl font-bold text-card-foreground">$0</span>
                <span className="text-muted-foreground ml-1">/ forever</span>
              </div>
              <ul className="space-y-3 flex-grow">
                {[
                  { text: 'Browse all destinations', included: true },
                  { text: 'Build & save itineraries', included: true },
                  { text: 'AI travel planner', included: true },
                  { text: 'Interactive map', included: true },
                  { text: 'Read & write reviews', included: true },
                  { text: 'Direct hotel booking', included: false },
                  { text: 'Direct activity booking', included: false },
                  { text: 'Car rental booking', included: false },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={feature.included ? 'text-card-foreground' : 'text-muted-foreground/50'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-8 w-full"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>

            {/* Annual Plan */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                BEST VALUE
              </div>
              <h4 className="text-2xl font-bold text-card-foreground">Annual</h4>
              <p className="text-muted-foreground mt-2 text-sm">Full access to every service</p>
              <div className="mt-6 mb-8">
                <span className="text-4xl font-bold text-card-foreground">5,000 RWF</span>
                <span className="text-muted-foreground ml-1">/ year</span>
                <p className="text-xs text-muted-foreground mt-1">≈ $3.4 USD</p>
              </div>
              <ul className="space-y-3 flex-grow">
                {[
                  'Browse all destinations',
                  'Build & save itineraries',
                  'AI travel planner',
                  'Interactive map',
                  'Read & write reviews',
                  'Direct hotel booking',
                  'Direct activity booking',
                  'Car rental booking',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-card-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                onClick={() => window.open('https://www.paypal.com/ncp/payment/YD6M888AMR5XW', '_blank')}
              >
                Subscribe Now
              </Button>
            </div>
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
