import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconMapPin,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { CATEGORIES } from './constants';
import { POICard } from './POICard';
import type { POI } from './types';

import type { Trip } from '../../../../types/trips';

export const SearchPanel = ({
  trip,
  showPanel,
  setShowPanel,
  placeSearch,
  setPlaceSearch,
  isSearchingPlace,
  onPlaceSearch,
  selectedDestinationIndex,
  onDestinationChange,
  categories,
  onCategoryToggle,
  isLoading,
  hasSearched,
  namedPois,
  addedPOIs,
  isSaving,
  onAddActivity,
}: {
  trip: Trip;
  showPanel: boolean;
  setShowPanel: (v: boolean) => void;
  placeSearch: string;
  setPlaceSearch: (v: string) => void;
  isSearchingPlace: boolean;
  onPlaceSearch: () => void;
  selectedDestinationIndex: string | null;
  onDestinationChange: (val: string | null) => void;
  categories: string[];
  onCategoryToggle: (val: string) => void;
  isLoading: boolean;
  hasSearched: boolean;
  namedPois: POI[];
  addedPOIs: Set<number>;
  isSaving: boolean;
  onAddActivity: (poi: POI) => void;
}) => {
  const { t } = useTranslation();

  return (
    <Paper
      shadow="lg"
      radius="md"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        bottom: 12,
        width: showPanel ? 380 : 'auto',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--mantine-color-body)',
        border: '1px solid var(--mantine-color-default-border)',
        transition: 'width 0.2s ease',
      }}
    >
      {showPanel ? (
        <Stack gap={0} flex={1} style={{ overflow: 'hidden' }}>
          {/* Panel header with close button */}
          <Group p="sm" pb={0} justify="space-between" align="center">
            <Text fw={700} size="sm">
              {t('explorer_search_and_filter', 'Search & Filter')}
            </Text>
            <ActionIcon variant="subtle" size="sm" onClick={() => setShowPanel(false)}>
              <IconX size={14} />
            </ActionIcon>
          </Group>

          {/* Place search */}
          <Box p="sm" pb={0}>
            <TextInput
              placeholder={t('explorer_search_place', 'Search food, attractions, parks...')}
              leftSection={<IconSearch size={16} />}
              rightSection={
                isSearchingPlace ? (
                  <Loader size={14} />
                ) : (
                  <ActionIcon variant="subtle" size="sm" onClick={onPlaceSearch} disabled={!placeSearch.trim()}>
                    <IconSearch size={14} />
                  </ActionIcon>
                )
              }
              size="sm"
              value={placeSearch}
              onChange={(e) => setPlaceSearch(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onPlaceSearch();
              }}
            />
          </Box>

          {/* Destination selector */}
          {trip.destinations && trip.destinations.length > 1 && (
            <Box p="sm" pb={0}>
              <Select
                label={t('explorer_destination', 'Destination')}
                data={trip.destinations.map((d, index) => ({
                  value: index.toString(),
                  label: d.name,
                }))}
                value={selectedDestinationIndex}
                onChange={onDestinationChange}
                allowDeselect={false}
                leftSection={<IconMapPin size={16} />}
                size="sm"
              />
            </Box>
          )}

          {/* Category chips - multi-select */}
          <Box p="sm">
            <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb={8} lh={1}>
              {t('explorer_categories', 'Categories')}
            </Text>
            <Grid>
              {CATEGORIES.map((cat) => {
                const isActive = categories.includes(cat.value);
                const CatIcon = cat.icon;
                return (
                  <Grid.Col span={6} key={cat.value}>
                    <Button
                      fullWidth
                      variant={isActive ? 'filled' : 'light'}
                      color={cat.color}
                      size="compact-sm"
                      onClick={() => onCategoryToggle(cat.value)}
                      leftSection={<CatIcon size={15} />}
                      styles={{
                        root: {
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.15s ease',
                          ...(isActive ? { boxShadow: `0 2px 8px ${cat.color}44` } : {}),
                        },
                      }}
                    >
                      {cat.label}
                    </Button>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Box>

          <Divider />

          {/* Results list */}
          <ScrollArea flex={1} offsetScrollbars type="auto" px="sm" py="xs">
            <Stack gap={8}>
              {isLoading && (
                <Stack align="center" py="xl" gap="sm">
                  <Loader size="md" type="dots" />
                  <Text size="sm" c="dimmed">
                    {t('explorer_loading', 'Discovering places...')}
                  </Text>
                </Stack>
              )}

              {!isLoading && hasSearched && namedPois.length > 0 && (
                <Text size="xs" c="dimmed" fw={500} mb={2}>
                  {namedPois.length} {t('explorer_results_count', 'places found')}
                </Text>
              )}

              {!isLoading &&
                namedPois.map((poi) => (
                  <POICard
                    key={poi.id}
                    poi={poi}
                    isAdded={addedPOIs.has(poi.id)}
                    isSaving={isSaving}
                    onAdd={onAddActivity}
                  />
                ))}

              {!isLoading && hasSearched && namedPois.length === 0 && (
                <Stack align="center" py="xl" gap="sm">
                  <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                    <IconSearch size={24} />
                  </ThemeIcon>
                  <Text ta="center" c="dimmed" size="sm">
                    {t('explorer_no_results', 'No results found')}
                  </Text>
                  <Text ta="center" c="dimmed" size="xs">
                    {t('explorer_try_different', 'Try a different category or search another area')}
                  </Text>
                </Stack>
              )}
            </Stack>
          </ScrollArea>

          {/* Footer with count */}
          {addedPOIs.size > 0 && (
            <Box
              p="sm"
              style={{
                borderTop: '1px solid var(--mantine-color-default-border)',
                background: 'var(--mantine-color-teal-0)',
              }}
            >
              <Group gap="xs" justify="center">
                <IconCheck size={16} color="var(--mantine-color-teal-6)" />
                <Text size="sm" fw={500} c="teal.7">
                  {addedPOIs.size}{' '}
                  {addedPOIs.size === 1
                    ? t('explorer_activity_added', 'activity added')
                    : t('explorer_activities_added', 'activities added')}
                </Text>
              </Group>
            </Box>
          )}
        </Stack>
      ) : (
        <Stack p="xs" gap="xs" align="center">
          <Tooltip label={t('explorer_show_panel', 'Show filters')} position="right">
            <ActionIcon
              variant="gradient"
              gradient={{ from: 'teal', to: 'cyan', deg: 135 }}
              size="lg"
              radius="md"
              onClick={() => setShowPanel(true)}
            >
              <IconSearch size={18} />
            </ActionIcon>
          </Tooltip>
          {addedPOIs.size > 0 && (
            <Badge size="lg" circle color="teal">
              {addedPOIs.size}
            </Badge>
          )}
        </Stack>
      )}
    </Paper>
  );
};
