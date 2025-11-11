import { Compass, Phone, Mail, MapPin } from 'lucide-react';

const TourOperators = () => {
  const operators = [
    {
      id: 'tours-rw',
      name: 'Rwanda Tours Ltd',
      description: 'Specializing in gorilla trekking and wildlife safaris.',
      image: 'https://placehold.co/400x300/145833/ffffff?text=Rwanda+Tours',
      contact: '+250 788 111 111',
      email: 'info@rwandatours.rw',
    },
    {
      id: 'gorilla-safaris',
      name: 'Gorilla Safaris',
      description: 'Premier provider of bespoke gorilla trekking experiences.',
      image: 'https://placehold.co/400x300/145833/ffffff?text=Gorilla+Safaris',
      contact: '+250 788 222 222',
      email: 'contact@gorillasafaris.rw',
    },
    {
      id: 'eco-travel-rw',
      name: 'Eco Travel Rwanda',
      description: 'Focus on sustainable and community-based tourism.',
      image: 'https://placehold.co/400x300/145833/ffffff?text=Eco+Travel',
      contact: '+250 788 333 333',
      email: 'hello@ecotravelrw.com',
    },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {operators.map((operator) => (
          <div key={operator.id} className="bg-card rounded-lg shadow-lg overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <img
                src={operator.image}
                alt={operator.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-2">{operator.name}</h3>
              <p className="text-muted-foreground mb-4">{operator.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone size={16} className="text-primary" />
                  <span>{operator.contact}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail size={16} className="text-primary" />
                  <span>{operator.email}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-muted rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Why Choose Our Partners?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              ✓
            </div>
            <h4 className="font-semibold mb-2">Licensed & Certified</h4>
            <p className="text-sm text-muted-foreground">
              All operators are officially licensed by Rwanda Development Board
            </p>
          </div>
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              ★
            </div>
            <h4 className="font-semibold mb-2">Expert Guides</h4>
            <p className="text-sm text-muted-foreground">
              Experienced local guides with deep knowledge of Rwanda
            </p>
          </div>
          <div>
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              ♥
            </div>
            <h4 className="font-semibold mb-2">Sustainable Tourism</h4>
            <p className="text-sm text-muted-foreground">
              Committed to eco-friendly practices and community development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOperators;
