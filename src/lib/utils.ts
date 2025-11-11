import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

// Estimate travel time based on distance (assumes average speed in Rwanda)
export function estimateTravelTime(distanceKm: number): string {
  // Average speed on Rwanda roads: ~50 km/h on highways, ~30 km/h in cities
  // We'll use 45 km/h as a conservative average
  const averageSpeedKmh = 45;
  const hours = distanceKm / averageSpeedKmh;
  const totalMinutes = Math.round(hours * 60);
  
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  } else {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  return `${Math.round(distanceKm)} km`;
}
