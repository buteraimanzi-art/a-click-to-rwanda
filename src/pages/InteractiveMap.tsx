import { MapPin } from 'lucide-react';

const InteractiveMap = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 pt-20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-full">
            <MapPin size={48} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-primary mb-4">Interactive Map</h2>
        <p className="text-lg text-muted-foreground">
          Explore Rwanda's amazing destinations
        </p>
      </div>
      <div className="bg-card rounded-lg shadow-lg p-8 text-center">
        <p className="text-muted-foreground">Map integration coming soon!</p>
      </div>
    </div>
  );
};

export default InteractiveMap;
