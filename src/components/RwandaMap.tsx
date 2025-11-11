import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'destination' | 'hotel';
}

interface RwandaMapProps {
  selectedLocations: Location[];
  showRoutes?: boolean;
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

const RwandaMap = ({ selectedLocations, showRoutes = true }: RwandaMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const rwandaCenter: L.LatLngTuple = [-1.9403, 29.8739];

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: rwandaCenter,
      zoom: 8,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers on selectedLocations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and routes
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Add new markers
    const valid = selectedLocations.filter(
      (loc) => typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
    );

    valid.forEach((loc, index) => {
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createCustomIcon(loc.type),
      })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:center">
            <h3 style="margin:0;font-weight:700">${loc.name}</h3>
            <p style="margin:4px 0 0 0;color:#666;text-transform:capitalize">${loc.type}</p>
            <p style="margin:4px 0 0 0;color:#999;font-size:12px">Stop ${index + 1}</p>
          </div>`
        );

      markersRef.current.push(marker);
    });

    // Draw route line connecting locations in order
    if (showRoutes && valid.length > 1) {
      const routeCoordinates = valid.map((loc) => [loc.latitude, loc.longitude] as L.LatLngTuple);
      
      routeLineRef.current = L.polyline(routeCoordinates, {
        color: '#145833',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
      }).addTo(map);
    }

    // Fit bounds if we have markers
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((l) => [l.latitude, l.longitude] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else {
      map.setView(rwandaCenter, 8);
    }
  }, [selectedLocations]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-lg">
      <div ref={mapContainerRef} className="absolute inset-0" />
    </div>
  );
};

export default RwandaMap;
