import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Transition,
} from '@mantine/core';
import {
  IconMap2,
  IconMapPin,
  IconSearch,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import { ChangeView, FlyToLocation, MapEvents } from './explorer/MapHelpers';
import { POIMarkers } from './explorer/POIMarkers';
import { SearchPanel } from './explorer/SearchPanel';
import { LodgingMarkers, TransportationMarkers } from './explorer/TravelMarkers';
import { useExplorerState } from './explorer/useExplorerState';

import type { Trip } from '../../../types/trips';

export const ActivityExplorerModal = ({
  opened,
  onClose,
  trip,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  trip: Trip;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const state = useExplorerState(trip, opened, onSuccess);

  return (
    <Modal
      fullScreen
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'cyan', deg: 135 }}>
            <IconMap2 size={20} />
          </ThemeIcon>
          <div>
            <Title order={4} lh={1.2}>
              {t('explorer_title', 'Activity Explorer')}
            </Title>
            {state.selectedDestination && (
              <Text size="xs" c="dimmed">
                {state.selectedDestination.name}
              </Text>
            )}
          </div>
        </Group>
      }
      padding={0}
      styles={{
        content: { height: '100%', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: {
          padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        },
      }}
    >
      <LoadingOverlay visible={state.isSaving} zIndex={1000} overlayProps={{ blur: 2 }} />
      <Box flex={1} style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Full-width Map */}
        <Box style={{ position: 'absolute', inset: 0 }}>
          {state.showSearchButton && (
            <Transition mounted={state.showSearchButton} transition="slide-down" duration={200}>
              {(styles) => (
                <Button
                  style={{
                    ...styles,
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                  leftSection={<IconSearch size={16} />}
                  onClick={state.handleSearch}
                  variant="gradient"
                  gradient={{ from: 'teal', to: 'cyan', deg: 135 }}
                  radius="xl"
                  size="sm"
                >
                  {t('explorer_search_this_area', 'Search this area')}
                </Button>
              )}
            </Transition>
          )}

          {!state.selectedDestination?.latitude ? (
            <Stack h="100%" align="center" justify="center" gap="md">
              <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                <IconMapPin size={32} />
              </ThemeIcon>
              <Text fw={500} c="dimmed">
                {t('explorer_no_coords', 'Selected destination has no coordinates')}
              </Text>
            </Stack>
          ) : (
            <MapContainer center={state.mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <ZoomControl position="bottomright" />
              <ChangeView center={state.mapCenter} />
              <MapEvents onMove={state.handleMapMove} />
              <FlyToLocation target={state.flyTarget} />

              <POIMarkers pois={state.namedPois} addedPOIs={state.addedPOIs} onAdd={state.handleAddActivity} />
              <TransportationMarkers transportations={state.transportations} />
              <LodgingMarkers lodgings={state.lodgings} />
            </MapContainer>
          )}
        </Box>

        {/* Floating overlay panel */}
        <SearchPanel
          trip={trip}
          showPanel={state.showPanel}
          setShowPanel={state.setShowPanel}
          placeSearch={state.placeSearch}
          setPlaceSearch={state.setPlaceSearch}
          isSearchingPlace={state.isSearchingPlace}
          onPlaceSearch={state.handlePlaceSearch}
          selectedDestinationIndex={state.selectedDestinationIndex}
          onDestinationChange={state.handleDestinationChange}
          categories={state.categories}
          onCategoryToggle={state.handleCategoryToggle}
          isLoading={state.isLoading}
          hasSearched={state.hasSearched}
          namedPois={state.namedPois}
          addedPOIs={state.addedPOIs}
          isSaving={state.isSaving}
          onAddActivity={state.handleAddActivity}
        />
      </Box>
    </Modal>
  );
};
