import {
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconCheck,
  IconPlus,
  IconStarFilled,
} from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Marker, Popup } from 'react-leaflet';

import { CATEGORIES, getCategoryForPOI, getCategoryLabel, getMarkerIcon } from './constants';
import type { POI } from './types';

export const POIMarkers = ({
  pois,
  addedPOIs,
  onAdd,
}: {
  pois: POI[];
  addedPOIs: Set<number>;
  onAdd: (poi: POI) => void;
}) => {
  const { t } = useTranslation();

  const getPoiIcon = useCallback((poi: POI) => {
    const cat = getCategoryForPOI(poi);
    const info = CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];
    return getMarkerIcon(info.color, info.markerIcon);
  }, []);

  const addedIcon = useMemo(() => getMarkerIcon('#20c997', '✓'), []);

  return (
    <>
      {pois.map((poi) => {
        const position: [number, number] = poi.center
          ? [poi.center.lat, poi.center.lon]
          : [poi.lat, poi.lon];
        const isAdded = addedPOIs.has(poi.id);
        const catLabel = getCategoryLabel(poi);

        return (
          <Marker key={poi.id} position={position} icon={isAdded ? addedIcon : getPoiIcon(poi)}>
            <Popup>
              <Stack gap="xs" style={{ minWidth: '220px' }}>
                <div>
                  <Text fw={700} size="sm" component="div">
                    {poi.tags.name}
                  </Text>
                  {catLabel && (
                    <Text size="xs" c="dimmed" mt={2}>
                      {catLabel}
                    </Text>
                  )}
                  {(poi.tags.rating || poi.tags.stars) && (
                    <Group gap={4} mt={4}>
                      <IconStarFilled size={12} color="#fcc419" />
                      <Text size="xs" fw={700} component="div">
                        {poi.tags.rating || poi.tags.stars}
                      </Text>
                    </Group>
                  )}
                </div>
                {(poi.tags['addr:street'] || poi.tags['addr:city']) && (
                  <Text size="xs" c="dimmed" component="div">
                    {[poi.tags['addr:housenumber'], poi.tags['addr:street'], poi.tags['addr:city']]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                )}
                {poi.tags.website && (
                  <Text size="xs" c="blue" component="a" href={poi.tags.website} target="_blank" rel="noopener">
                    {t('explorer_visit_website', 'Visit website')}
                  </Text>
                )}
                <Button
                  size="compact-sm"
                  radius="md"
                  leftSection={isAdded ? <IconCheck size={14} /> : <IconPlus size={14} />}
                  onClick={() => !isAdded && onAdd(poi)}
                  disabled={isAdded}
                  color={isAdded ? 'teal' : undefined}
                  variant={isAdded ? 'light' : 'filled'}
                >
                  {isAdded ? t('explorer_added', 'Added!') : t('explorer_add_to_trip', 'Add to Trip')}
                </Button>
              </Stack>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
