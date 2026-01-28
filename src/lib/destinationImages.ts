// Destination images mapping
import kigaliImg from '@/assets/destinations/kigali.jpg';
import musanzeImg from '@/assets/destinations/musanze.jpg';
import musanze2Img from '@/assets/destinations/musanze-2.jpg';
import lakeKivuImg from '@/assets/destinations/lake-kivu.jpg';
import lakeKivu2Img from '@/assets/destinations/lake-kivu-2.jpg';
import nyungweImg from '@/assets/destinations/nyungwe-national-park.jpg';
import nyungwe2Img from '@/assets/destinations/nyungwe-national-park-2.jpg';
import akageraImg from '@/assets/destinations/akagera-national-park.jpg';
import akagera2Img from '@/assets/destinations/akagera-national-park-2.jpg';
import kingspalaceImg from '@/assets/destinations/kings-palace-museum.jpg';
import kingspalace2Img from '@/assets/destinations/kings-palace-museum-2.jpg';
import kandthouseImg from '@/assets/destinations/kandt-house-museum.jpg';
import kandthouse2Img from '@/assets/destinations/kandt-house-museum-2.jpg';
import genocideMuseumImg from '@/assets/destinations/campaign-against-genocide-museum.jpg';
import genocideMuseum2Img from '@/assets/destinations/campaign-against-genocide-museum-2.jpg';
import rwandaArtImg from '@/assets/destinations/rwanda-art-museum.jpg';
import rwandaArt2Img from '@/assets/destinations/rwanda-art-museum-2.jpg';
import ethnographicImg from '@/assets/destinations/ethnographic-museum.jpg';
import volcanoesImg from '@/assets/destinations/volcanoes-np.webp';

// Map destination IDs to their images
export const destinationImages: Record<string, string> = {
  // Cities
  'kigali': kigaliImg,
  'musanze': musanzeImg,
  
  // National Parks
  'volcanoes': volcanoesImg,
  'nyungwe': nyungweImg,
  'akagera': akageraImg,
  
  // Lakes
  'lake-kivu': lakeKivuImg,
  'kivu': lakeKivuImg,
  
  // Museums
  'kings-palace': kingspalaceImg,
  'kandt-house': kandthouseImg,
  'campaign-genocide': genocideMuseumImg,
  'rwanda-art': rwandaArtImg,
  'ethnographic': ethnographicImg,
  'liberation': genocideMuseumImg,
  'art-gallery': rwandaArtImg,
  'presidential-palace': kingspalaceImg,
  'environment': rwandaArtImg,
  'nyanza-art': rwandaArtImg,
};

// Get destination image by ID with fallback
export const getDestinationImage = (destinationId: string): string | null => {
  const normalizedId = destinationId?.toLowerCase();
  return destinationImages[normalizedId] || null;
};

// Get destination image URL for HTML documents (base64 encoded)
export const getDestinationImageUrl = (destinationId: string): string => {
  // For downloaded HTML files, use placeholder URLs that will work offline
  const placeholderImages: Record<string, string> = {
    'volcanoes': 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80',
    'musanze': 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80',
    'akagera': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80',
    'nyungwe': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80',
    'lake-kivu': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'kivu': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'kigali': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
    'kings-palace': 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80',
    'kandt-house': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
    'campaign-genocide': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
    'rwanda-art': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
    'ethnographic': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
  };
  
  const normalizedId = destinationId?.toLowerCase();
  return placeholderImages[normalizedId] || 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80';
};
