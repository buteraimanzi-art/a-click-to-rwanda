import { useState, useEffect, useRef } from 'react';
import { MapPin, Utensils, Navigation, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  distance: number;
  lat: number;
  lon: number;
  description: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const InteractiveMap = () => {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-1.9403, 29.8739], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Auto-locate user on load
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserLocation({ lat, lon });
        setLocating(false);

        const userIcon = L.divIcon({
          html: '<div style="background:hsl(145,65%,35%);width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);animation:pulse 2s infinite"></div>',
          iconSize: [16, 16],
          className: '',
        });
        userMarkerRef.current = L.marker([lat, lon], { icon: userIcon })
          .bindPopup('📍 You are here')
          .addTo(map);

        map.setView([lat, lon], 14);
      },
      () => {
        setLocating(false);
        setError('Could not detect your location. Please enable location permissions and refresh.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const fetchNearbyRestaurants = async () => {
    setLoading(true);
    setError(null);
    setRestaurants([]);
    setShowResults(true);

    try {
      let lat: number, lon: number;

      if (userLocation) {
        lat = userLocation.lat;
        lon = userLocation.lon;
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        setUserLocation({ lat, lon });
      }

      // Query Overpass API for nearby restaurants within 5km
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"="restaurant"](around:5000,${lat},${lon});
          node["amenity"="cafe"](around:5000,${lat},${lon});
          node["amenity"="fast_food"](around:5000,${lat},${lon});
        );
        out body 20;
      `;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!res.ok) throw new Error('Failed to fetch restaurants');

      const data = await res.json();

      const parsed: Restaurant[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: el.id,
          name: el.tags.name,
          cuisine: el.tags.cuisine || el.tags.amenity === 'cafe' ? 'Café' : el.tags.cuisine || 'Restaurant',
          distance: haversineDistance(lat, lon, el.lat, el.lon),
          lat: el.lat,
          lon: el.lon,
          description: buildDescription(el.tags),
        }))
        .sort((a: Restaurant, b: Restaurant) => a.distance - b.distance)
        .slice(0, 3);

      if (parsed.length === 0) {
        setError('No restaurants found nearby. Try moving to a more populated area.');
      } else {
        setRestaurants(parsed);
        showOnMap(lat, lon, parsed);
      }
    } catch (err: any) {
      if (err.code === 1) {
        setError('Location access denied. Please enable location permissions.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Could not find restaurants. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const buildDescription = (tags: any): string => {
    const parts: string[] = [];
    if (tags.cuisine) parts.push(`Cuisine: ${tags.cuisine.replace(/;/g, ', ')}`);
    if (tags.opening_hours) parts.push(`Hours: ${tags.opening_hours}`);
    if (tags.phone) parts.push(`📞 ${tags.phone}`);
    if (!parts.length) {
      if (tags.amenity === 'cafe') return 'A cozy café spot for drinks and light meals.';
      if (tags.amenity === 'fast_food') return 'Quick bites and fast service.';
      return 'A local dining spot worth exploring.';
    }
    return parts.join(' · ');
  };

  const showOnMap = (userLat: number, userLon: number, results: Restaurant[]) => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    // User marker
    const userIcon = L.divIcon({
      html: '<div style="background:hsl(145,65%,35%);width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      iconSize: [14, 14],
      className: '',
    });
    L.marker([userLat, userLon], { icon: userIcon }).bindPopup('📍 You are here').addTo(markersRef.current);

    // Restaurant markers
    results.forEach((r) => {
      const icon = L.divIcon({
        html: '<div style="background:hsl(25,75%,55%);width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [12, 12],
        className: '',
      });
      L.marker([r.lat, r.lon], { icon }).bindPopup(`<b>${r.name}</b><br/>${(r.distance * 1000).toFixed(0)}m away`).addTo(markersRef.current!);
    });

    const bounds = L.latLngBounds([[userLat, userLon], ...results.map((r) => [r.lat, r.lon] as [number, number])]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const navigateToRestaurant = (r: Restaurant) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Interactive Map</h1>
        <p className="text-muted-foreground">Explore Rwanda's destinations & find nearby restaurants</p>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg border border-border mb-6" />

      {/* Location status */}
      {locating && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={16} />
          Detecting your location...
        </div>
      )}
      {userLocation && !locating && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-primary">
          <MapPin size={16} />
          Location found — ready to search nearby
        </div>
      )}
      {!userLocation && !locating && error && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-destructive">
          <MapPin size={16} />
          {error}
        </div>
      )}

      {/* Find Restaurants Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={fetchNearbyRestaurants}
          disabled={loading || locating || !userLocation}
          size="lg"
          className="gap-2 text-base px-8 py-6 rounded-full shadow-md"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Utensils size={20} />}
          {loading ? 'Finding Restaurants...' : '🍽️ Find Nearby Restaurants'}
        </Button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {restaurants.length > 0 ? 'Closest Restaurants' : 'Results'}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => { setShowResults(false); setRestaurants([]); }}>
              <X size={18} />
            </Button>
          </div>

          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {restaurants.map((r, i) => (
              <Card key={r.id} className="overflow-hidden hover:shadow-lg transition-shadow border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-accent/10 text-accent rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{r.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {(r.distance * 1000).toFixed(0)}m away
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{r.description}</p>
                  <Button
                    onClick={() => navigateToRestaurant(r)}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Navigation size={14} />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
