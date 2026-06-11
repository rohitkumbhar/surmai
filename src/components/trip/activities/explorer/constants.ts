import {
  IconBinoculars,
  IconMasksTheater,
  IconToolsKitchen2,
  IconTree,
} from '@tabler/icons-react';
import L from 'leaflet';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import type { POI } from './types';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const CATEGORIES = [
  { value: 'food_drink', label: 'Food & Drink', color: '#ff922b', icon: IconToolsKitchen2, markerIcon: '🍽' },
  { value: 'attractions', label: 'Attractions', color: '#be4bdb', icon: IconBinoculars, markerIcon: '⭐' },
  { value: 'outdoors', label: 'Parks & Nature', color: '#40c057', icon: IconTree, markerIcon: '🌿' },
  { value: 'culture', label: 'Culture', color: '#339af0', icon: IconMasksTheater, markerIcon: '🎭' },
];

export const getMarkerIcon = (color: string, text: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2.5px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    ">
      <div style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold; font-family: system-ui, sans-serif;">
        ${text}
      </div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

export const getCategoryForPOI = (poi: POI): string => {
  if (poi.tags.amenity && /restaurant|cafe|bar|pub|fast_food/.test(poi.tags.amenity)) return 'food_drink';
  if (poi.tags.tourism || poi.tags.historic) return 'attractions';
  if (poi.tags.leisure || poi.tags.natural) return 'outdoors';
  if (poi.tags.amenity && /theatre|cinema|arts_centre|library|community_centre|planetarium/.test(poi.tags.amenity)) return 'culture';
  return 'food_drink';
};

export const getCategoryLabel = (poi: POI) => {
  const raw =
    poi.tags.tourism?.replace(/_/g, ' ') ||
    poi.tags.amenity?.replace(/_/g, ' ') ||
    poi.tags.historic?.replace(/_/g, ' ') ||
    poi.tags.leisure?.replace(/_/g, ' ') ||
    poi.tags.natural?.replace(/_/g, ' ');
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};
