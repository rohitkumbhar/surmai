import L from 'leaflet';
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { fetchPOIsFromBackend, listLodgings, listTransportations, saveActivity } from '../../../../lib/api';
import { CATEGORIES } from './constants';
import type { POI } from './types';
import type { Trip } from '../../../../types/trips';

const buildOverpassQuery = (lat: number, lon: number, cats: string[], bounds?: L.LatLngBounds): string => {
  let area = `(around:5000, ${lat}, ${lon})`;
  if (bounds) {
    area = `(${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()})`;
  }

  const parts: string[] = [];
  for (const cat of cats) {
    if (cat === 'food_drink') {
      parts.push(`node["amenity"~"restaurant|cafe|bar|pub|fast_food"]${area}`);
      parts.push(`way["amenity"~"restaurant|cafe|bar|pub|fast_food"]${area}`);
    } else if (cat === 'attractions') {
      parts.push(`node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium"]${area}`);
      parts.push(`way["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium"]${area}`);
      parts.push(`node["historic"~"monument|memorial|castle|ruins|archaeological_site|fort"]${area}`);
      parts.push(`way["historic"~"monument|memorial|castle|ruins|archaeological_site|fort"]${area}`);
    } else if (cat === 'outdoors') {
      parts.push(`node["leisure"~"park|garden|nature_reserve|playground|common"]${area}`);
      parts.push(`way["leisure"~"park|garden|nature_reserve|playground|common"]${area}`);
      parts.push(`node["natural"~"beach|peak|water|cliff"]${area}`);
      parts.push(`way["natural"~"beach|peak|water|cliff"]${area}`);
    } else if (cat === 'culture') {
      parts.push(`node["amenity"~"theatre|cinema|arts_centre|library|community_centre|planetarium"]${area}`);
      parts.push(`way["amenity"~"theatre|cinema|arts_centre|library|community_centre|planetarium"]${area}`);
    }
  }

  if (parts.length === 0) return '';
  return `[out:json];(${parts.join(';')};);out center;`;
};

const buildSearchQuery = (lat: number, lon: number, searchTerm: string, cats: string[], bounds?: L.LatLngBounds): string => {
  let area = `(around:5000, ${lat}, ${lon})`;
  if (bounds) {
    area = `(${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()})`;
  }

  const nameFilter = `["name"~"${searchTerm}",i]`;
  const parts: string[] = [];
  const activeCats = cats.length > 0 ? cats : CATEGORIES.map((c) => c.value);

  for (const cat of activeCats) {
    if (cat === 'food_drink') {
      parts.push(`node${nameFilter}["amenity"~"restaurant|cafe|bar|pub|fast_food"]${area}`);
      parts.push(`way${nameFilter}["amenity"~"restaurant|cafe|bar|pub|fast_food"]${area}`);
    } else if (cat === 'attractions') {
      parts.push(`node${nameFilter}["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium"]${area}`);
      parts.push(`way${nameFilter}["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium"]${area}`);
      parts.push(`node${nameFilter}["historic"~"monument|memorial|castle|ruins|archaeological_site|fort"]${area}`);
      parts.push(`way${nameFilter}["historic"~"monument|memorial|castle|ruins|archaeological_site|fort"]${area}`);
    } else if (cat === 'outdoors') {
      parts.push(`node${nameFilter}["leisure"~"park|garden|nature_reserve|playground|common"]${area}`);
      parts.push(`way${nameFilter}["leisure"~"park|garden|nature_reserve|playground|common"]${area}`);
      parts.push(`node${nameFilter}["natural"~"beach|peak|water|cliff"]${area}`);
      parts.push(`way${nameFilter}["natural"~"beach|peak|water|cliff"]${area}`);
    } else if (cat === 'culture') {
      parts.push(`node${nameFilter}["amenity"~"theatre|cinema|arts_centre|library|community_centre|planetarium"]${area}`);
      parts.push(`way${nameFilter}["amenity"~"theatre|cinema|arts_centre|library|community_centre|planetarium"]${area}`);
    }
  }

  if (parts.length === 0) return '';
  return `[out:json];(${parts.join(';')};);out center;`;
};

export const useExplorerState = (trip: Trip, opened: boolean, onSuccess: () => void) => {
  const { t } = useTranslation();
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState<string | null>(
    trip.destinations?.length ? '0' : null
  );
  const [categories, setCategories] = useState<string[]>(['food_drink']);
  const [isSaving, setIsSaving] = useState(false);
  const [addedPOIs, setAddedPOIs] = useState<Set<number>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [searchResults, setSearchResults] = useState<POI[] | null>(null);

  const selectedDestination = useMemo(() => {
    if (!trip.destinations || selectedDestinationIndex === null) return null;
    return trip.destinations[parseInt(selectedDestinationIndex)];
  }, [trip.destinations, selectedDestinationIndex]);

  const { data: transportations } = useQuery({
    queryKey: ['transportations', trip.id],
    queryFn: () => listTransportations(trip.id),
    enabled: opened,
  });

  const { data: lodgings } = useQuery({
    queryKey: ['lodgings', trip.id],
    queryFn: () => listLodgings(trip.id),
    enabled: opened,
  });

  const fetchPOIs = async (lat: number, lon: number, cats: string[], bounds?: L.LatLngBounds): Promise<POI[]> => {
    const query = buildOverpassQuery(lat, lon, cats, bounds);
    if (!query) return [];
    const data = await fetchPOIsFromBackend(query);
    return data.elements;
  };

  const {
    data: pois,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pois', selectedDestination?.latitude, selectedDestination?.longitude, categories.join(','), mapBounds?.toBBoxString()],
    queryFn: () =>
      fetchPOIs(
        parseFloat(selectedDestination!.latitude!),
        parseFloat(selectedDestination!.longitude!),
        categories,
        mapBounds || undefined
      ),
    enabled: !!selectedDestination?.latitude && !!selectedDestination?.longitude && opened && hasSearched && categories.length > 0,
  });

  const handleMapMove = useCallback((map: L.Map) => {
    setMapBounds(map.getBounds());
    setShowSearchButton(true);
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setShowSearchButton(false);
    setSearchResults(null);
    refetch();
  };

  const handleCategoryToggle = (val: string) => {
    setCategories((prev) => {
      if (prev.includes(val)) {
        return prev.filter((c) => c !== val);
      }
      return [...prev, val];
    });
    setHasSearched(true);
    setShowSearchButton(false);
  };

  const handleDestinationChange = (val: string | null) => {
    setSelectedDestinationIndex(val);
    setHasSearched(false);
  };

  const handlePlaceSearch = async () => {
    if (!placeSearch.trim() || !selectedDestination?.latitude || !selectedDestination?.longitude) return;
    setIsSearchingPlace(true);
    try {
      const destLat = parseFloat(selectedDestination.latitude);
      const destLon = parseFloat(selectedDestination.longitude);
      const query = buildSearchQuery(destLat, destLon, placeSearch.trim(), categories, mapBounds || undefined);
      if (!query) return;
      const data = await fetchPOIsFromBackend(query);
      const results: POI[] = data.elements || [];
      setHasSearched(true);
      setShowSearchButton(false);
      if (results.length > 0) {
        const first = results[0];
        const pos: [number, number] = first.center
          ? [first.center.lat, first.center.lon]
          : [first.lat, first.lon];
        setFlyTarget(pos);
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Place search failed', error);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const handleAddActivity = async (poi: POI) => {
    setIsSaving(true);
    try {
      const addressParts = [
        poi.tags['addr:housenumber'],
        poi.tags['addr:street'],
        poi.tags['addr:city'],
      ].filter(Boolean);
      const address = addressParts.join(', ') || t('explorer_unknown_address', 'Unknown Address');

      await saveActivity(
        trip.id,
        {
          entityData: {
            name: poi.tags.name || t('explorer_unnamed_place', 'Unnamed Place'),
            address: address,
            startDate: trip.startDate,
            metadata: {
              isDraft: true,
              source: 'explorer',
              osmId: poi.id,
              category: poi.tags.amenity,
            },
          },
        },
        []
      );
      setAddedPOIs((prev) => new Set(prev).add(poi.id));
      onSuccess();
    } catch (error) {
      console.error('Failed to add activity', error);
    } finally {
      setIsSaving(false);
    }
  };

  const mapCenter: [number, number] = useMemo(
    () => [parseFloat(selectedDestination?.latitude || '0'), parseFloat(selectedDestination?.longitude || '0')],
    [selectedDestination]
  );

  const namedPois = useMemo(() => {
    const source = searchResults !== null ? searchResults : pois;
    return source?.filter((p) => p.tags.name) || [];
  }, [pois, searchResults]);

  return {
    selectedDestinationIndex,
    selectedDestination,
    categories,
    isSaving,
    addedPOIs,
    hasSearched,
    showSearchButton,
    placeSearch,
    setPlaceSearch,
    isSearchingPlace,
    flyTarget,
    showPanel,
    setShowPanel,
    transportations,
    lodgings,
    isLoading,
    mapCenter,
    namedPois,
    handleMapMove,
    handleSearch,
    handleCategoryToggle,
    handleDestinationChange,
    handlePlaceSearch,
    handleAddActivity,
  };
};
