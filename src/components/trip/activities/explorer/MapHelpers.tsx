import L from 'leaflet';
import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

export const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const MapEvents = ({ onMove }: { onMove: (map: L.Map) => void }) => {
  const map = useMapEvents({
    moveend: () => onMove(map),
    zoomend: () => onMove(map),
  });
  return null;
};

export const FlyToLocation = ({ target }: { target: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 14, { duration: 1.5 });
    }
  }, [target, map]);
  return null;
};
