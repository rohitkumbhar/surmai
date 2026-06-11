export interface POI {
  id: number;
  type: string;
  lat: number;
  lon: number;
  center?: { lat: number; lon: number };
  tags: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    amenity?: string;
    tourism?: string;
    historic?: string;
    leisure?: string;
    natural?: string;
    rating?: string;
    stars?: string;
    website?: string;
    phone?: string;
    [key: string]: any;
  };
}
