import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RwandaMapProps {
  selectedLocations: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type: 'destination' | 'hotel';
  }>;
  mapboxToken?: string;
}

const RwandaMap = ({ selectedLocations, mapboxToken }: RwandaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [29.8739, -1.9403], // Rwanda center
      zoom: 8,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for selected locations
    selectedLocations.forEach(location => {
      if (location.latitude && location.longitude) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = location.type === 'destination' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<h3 style="margin:0;font-weight:bold;">${location.name}</h3><p style="margin:4px 0 0 0;color:#666;">${location.type}</p>`)
          )
          .addTo(map.current!);

        markers.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (selectedLocations.length > 0) {
      const validLocations = selectedLocations.filter(loc => loc.latitude && loc.longitude);
      if (validLocations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validLocations.forEach(loc => {
          bounds.extend([loc.longitude, loc.latitude]);
        });
        map.current?.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      }
    }
  }, [selectedLocations]);

  if (!mapboxToken) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <p className="text-muted-foreground mb-4">
          To display the interactive map, please enter your Mapbox public token below:
        </p>
        <p className="text-sm text-muted-foreground">
          Get your free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default RwandaMap;
