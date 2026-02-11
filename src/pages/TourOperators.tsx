import { useState } from 'react';
import { Compass, Phone, Mail, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ImageCarousel = ({ images, fallbackUrl, name }: { images: any[]; fallbackUrl: string; name: string }) => {
  const [current, setCurrent] = useState(0);
  const allImages = images.length > 0
    ? images.sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url)
    : [fallbackUrl];

  return (
    <div className="relative h-48 overflow-hidden">
      <img
        src={allImages[current]}
        alt={`${name} - ${current + 1}`}
        className="w-full h-full object-cover transition-all duration-300"
      />
      {allImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(p => (p - 1 + allImages.length) % allImages.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(p => (p + 1) % allImages.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TourOperators = () => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['tour-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: companyImages = [] } = useQuery({
    queryKey: ['tour-company-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_company_images')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const getImagesForCompany = (companyId: string) => companyImages.filter((i: any) => i.company_id === companyId);

  return (
    <div className="max-w-7xl mx-auto p-8 pt-20">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-full">
            <Compass size={48} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-primary mb-4">Tour Operators</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect with our trusted local tour operators who bring years of experience and passion
          for showcasing the best of Rwanda.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tour operators...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tour operators listed yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map((operator: any) => (
            <div key={operator.id} className="bg-card rounded-lg shadow-lg overflow-hidden group">
              <ImageCarousel
                images={getImagesForCompany(operator.id)}
                fallbackUrl={operator.image_url || `https://placehold.co/400x300/145833/ffffff?text=${encodeURIComponent(operator.name)}`}
                name={operator.name}
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-card-foreground mb-2">{operator.name}</h3>
                <p className="text-muted-foreground mb-4">{operator.description}</p>
                <div className="space-y-2 text-sm">
                  {operator.phone && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone size={16} className="text-primary" />
                      <span>{operator.phone}</span>
                    </div>
                  )}
                  {operator.email && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail size={16} className="text-primary" />
                      <span>{operator.email}</span>
                    </div>
                  )}
                  {operator.website && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Globe size={16} className="text-primary" />
                      <a href={operator.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-muted rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Why Choose Our Partners?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">✓</div>
            <h4 className="font-semibold mb-2">Licensed & Certified</h4>
            <p className="text-sm text-muted-foreground">All operators are officially licensed by Rwanda Development Board</p>
          </div>
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">★</div>
            <h4 className="font-semibold mb-2">Expert Guides</h4>
            <p className="text-sm text-muted-foreground">Experienced local guides with deep knowledge of Rwanda</p>
          </div>
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">♥</div>
            <h4 className="font-semibold mb-2">Sustainable Tourism</h4>
            <p className="text-sm text-muted-foreground">Committed to eco-friendly practices and community development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOperators;
