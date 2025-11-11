import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RwandaMapProps {
  selectedLocations: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type: 'destination' | 'hotel';
  }>;
}

// Custom icons for different types
const createCustomIcon = (type: 'destination' | 'hotel') => {
  const color = type === 'destination' ? '#145833' : '#8B4513';
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.437 12.5 28.5 12.5 28.5S25 20.937 25 12.5C25 5.596 19.404 0 12.5 0z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41],
  });
};

// Component to fit map bounds to markers
const FitBounds = ({ locations }: { locations: RwandaMapProps['selectedLocations'] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map((loc) => [loc.latitude, loc.longitude] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [locations, map]);

  return null;
};

const RwandaMap = ({ selectedLocations }: RwandaMapProps) => {
  const rwandaCenter: L.LatLngTuple = [-1.9403, 29.8739];

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-lg">
      <MapContainer
        center={rwandaCenter}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {selectedLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude] as L.LatLngTuple}
            icon={createCustomIcon(location.type)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-base">{location.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{location.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {selectedLocations.length > 0 && <FitBounds locations={selectedLocations} />}
      </MapContainer>
    </div>
  );
};

export default RwandaMap;
