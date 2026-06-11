import {
  Badge,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconBed,
  IconBus,
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Marker, Popup } from 'react-leaflet';

import { getMarkerIcon } from './constants';

import type { Lodging, Transportation } from '../../../../types/trips';

export const TransportationMarkers = ({ transportations }: { transportations?: Transportation[] }) => {
  const { t } = useTranslation();
  const transportIcon = useMemo(() => getMarkerIcon('#fa5252', '🚌'), []);

  if (!transportations) return null;

  return (
    <>
      {transportations.map((transport) => {
        const markers = [];
        if (transport.metadata?.origin?.latitude && transport.metadata?.origin?.longitude) {
          markers.push(
            <Marker
              key={`trans-origin-${transport.id}`}
              position={[
                parseFloat(transport.metadata.origin.latitude),
                parseFloat(transport.metadata.origin.longitude),
              ]}
              icon={transportIcon}
            >
              <Popup>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBus size={14} />
                    <Text fw={700} size="sm">
                      {transport.type.toUpperCase()}
                    </Text>
                  </Group>
                  <Text size="xs">{transport.origin}</Text>
                  <Badge size="xs" color="red" variant="light">
                    {t('transportation_origin', 'Origin')}
                  </Badge>
                </Stack>
              </Popup>
            </Marker>
          );
        }
        if (transport.metadata?.destination?.latitude && transport.metadata?.destination?.longitude) {
          markers.push(
            <Marker
              key={`trans-dest-${transport.id}`}
              position={[
                parseFloat(transport.metadata.destination.latitude),
                parseFloat(transport.metadata.destination.longitude),
              ]}
              icon={transportIcon}
            >
              <Popup>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBus size={14} />
                    <Text fw={700} size="sm">
                      {transport.type.toUpperCase()}
                    </Text>
                  </Group>
                  <Text size="xs">{transport.destination}</Text>
                  <Badge size="xs" color="red" variant="light">
                    {t('transportation_destination', 'Destination')}
                  </Badge>
                </Stack>
              </Popup>
            </Marker>
          );
        }
        return markers;
      })}
    </>
  );
};

export const LodgingMarkers = ({ lodgings }: { lodgings?: Lodging[] }) => {
  const { t } = useTranslation();
  const lodgingIcon = useMemo(() => getMarkerIcon('#fcc419', '🏨'), []);

  if (!lodgings) return null;

  return (
    <>
      {lodgings.map((l) => {
        if (l.metadata?.place?.latitude && l.metadata?.place?.longitude) {
          return (
            <Marker
              key={`lodging-${l.id}`}
              position={[parseFloat(l.metadata.place.latitude), parseFloat(l.metadata.place.longitude)]}
              icon={lodgingIcon}
            >
              <Popup>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBed size={14} />
                    <Text fw={700} size="sm">
                      {l.name}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {l.address}
                  </Text>
                  <Badge size="xs" color="yellow" variant="light">
                    {t('lodging', 'Lodging')}
                  </Badge>
                </Stack>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </>
  );
};
