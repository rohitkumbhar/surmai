import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  LoadingOverlay,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import L from 'leaflet';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link, useSearchParams } from 'react-router-dom';

import 'leaflet/dist/leaflet.css';
import { useTravelBoardStatistics } from './useTravelBoardStatistics';
import { Header } from '../../components/nav/Header';
import { listAllTrips } from '../../lib/api';
import { usePageTitle } from '../../lib/hooks/usePageTitle';

import type { Trip } from '../../types/trips';

// Fix for default marker icons in Leaflet with Webpack/Vite

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const StatsCard = ({ title, value, note }: { title: string; value: string | number; note?: string }) => (
  <Card withBorder radius="md" p="md">
    <Stack gap={0}>
      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
        {title}
      </Text>
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {note && (
        <Text size="xs" c="orange" mt={4}>
          {note}
        </Text>
      )}
    </Stack>
  </Card>
);

const TravelBoard = () => {
  const { t } = useTranslation();
  usePageTitle(t('travel_board', 'Travel Board'));
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = dayjs().year().toString();
  const selectedYear = searchParams.get('year') || currentYear;

  const setSelectedYear = (year: string) => {
    setSearchParams((prev) => {
      prev.set('year', year);
      return prev;
    });
  };

  const { data: allTrips } = useQuery<Trip[]>({
    queryKey: ['all_trips_meta'],
    queryFn: () => listAllTrips(),
  });

  const years = useMemo(() => {
    if (!allTrips) return [currentYear];
    const tripYears = allTrips.map((trip) => dayjs(trip.startDate).year().toString());
    return Array.from(new Set([currentYear, ...tripYears])).sort((a, b) => b.localeCompare(a));
  }, [allTrips, currentYear]);

  const { stats: filteredData, isLoading } = useTravelBoardStatistics(selectedYear);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Container py="sm" size="xl">
      <Header>
        <Group justify="space-between" mt="md">
          <Text size="md">{t('travel_board', 'Travel Board')}</Text>
          <Group gap="xs">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? 'light' : 'subtle'}
                size="xs"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </Group>
        </Group>
      </Header>

      <Box pos="relative">
        <LoadingOverlay visible={isLoading} overlayProps={{ radius: 'sm', blur: 2 }} />

        {filteredData && (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <StatsCard title={t('trips', 'Trips')} value={filteredData.totalTrips} />
              <StatsCard title={t('destinations', 'Destinations')} value={filteredData.totalDestinations} />
              <StatsCard title={t('days', 'Days')} value={filteredData.totalDays} />
              <StatsCard
                title={t('cost', 'Cost')}
                value={`${filteredData.totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${filteredData.userCurrency}`}
                note={
                  filteredData.isDefaultCurrency
                    ? t('default_currency_note', 'Showing in USD (default) because no currency is set in your profile.')
                    : undefined
                }
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Card withBorder radius="md" p="md">
                <Title order={4} mb="md">
                  {t('transportation_stats', 'Transportation Stats')}
                </Title>
                <Divider mb="sm" />
                <Stack gap="xs">
                  {Object.entries(filteredData.transCounts).map(([type, count]) => (
                    <Group key={type} justify="space-between">
                      <Text size="sm" tt="capitalize">
                        {t(`transport_${type}`, type.replace('_', ' '))}
                      </Text>
                      <Group gap="xl">
                        <Text size="sm" fw={500}>
                          {count} {t('trips', 'trips')}
                        </Text>
                        <Stack align="flex-end" gap={0}>
                          <Text size="sm" c="dimmed">
                            {formatDuration(filteredData.transTimeByMode[type] || 0)}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {t('avg', 'Avg.')}:{' '}
                            {formatDuration(Math.round((filteredData.transTimeByMode[type] || 0) / count))}
                          </Text>
                        </Stack>
                      </Group>
                    </Group>
                  ))}
                  {Object.keys(filteredData.transCounts).length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="sm">
                      {t('no_data', 'No data')}
                    </Text>
                  )}
                </Stack>
                <Divider my="sm" />
                <Group justify="space-between">
                  <Text fw={600}>{t('total_travel_time', 'Total Travel Time')}</Text>
                  <Text fw={600}>{formatDuration(filteredData.totalTransTimeMinutes)}</Text>
                </Group>
              </Card>

              <Card withBorder radius="md" p="md">
                <Title order={4} mb="md">
                  {t('lodging_stats', 'Lodging Stats')}
                </Title>
                <Divider mb="sm" />
                {filteredData.totalLodgings > 0 ? (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">{t('total_lodgings', 'Total Lodgings')}</Text>
                      <Text fw={500}>{filteredData.totalLodgings}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">{t('total_nights', 'Total Nights')}</Text>
                      <Text fw={500}>{filteredData.totalNights}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">{t('avg_nights_per_lodging', 'Avg. Nights per Lodging')}</Text>
                      <Text fw={500}>{(filteredData.totalNights / filteredData.totalLodgings).toFixed(1)}</Text>
                    </Group>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    {t('no_data', 'No data')}
                  </Text>
                )}
              </Card>

              <Card withBorder radius="md" p="md">
                <Title order={4} mb="md">
                  {t('activity_stats', 'Activity Stats')}
                </Title>
                <Divider mb="sm" />
                {filteredData.totalActivities > 0 ? (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">{t('total_activities', 'Total Activities')}</Text>
                      <Text fw={500}>{filteredData.totalActivities}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">{t('avg_activities_per_trip', 'Avg. Activities per Trip')}</Text>
                      <Text fw={500}>{filteredData.avgActivitiesPerTrip.toFixed(1)}</Text>
                    </Group>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    {t('no_data', 'No data')}
                  </Text>
                )}
              </Card>

              <Card withBorder radius="md" p="md">
                <Title order={4} mb="md">
                  {t('expense_stats', 'Expense Stats')}
                </Title>
                <Divider mb="sm" />
                {filteredData.numCurrencies > 0 ? (
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">{t('currencies_used', 'Currencies Used')}</Text>
                      <Text fw={500}>{filteredData.numCurrencies}</Text>
                    </Group>
                    <Divider my="xs" label={t('totals_per_currency', 'Totals per Currency')} labelPosition="center" />
                    {Object.entries(filteredData.totalsByCurrency)
                      .sort((a, b) => b[1] - a[1])
                      .map(([currency, amount]) => (
                        <Group key={currency} justify="space-between">
                          <Text size="sm">{currency}</Text>
                          <Text size="sm" fw={500}>
                            {amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {currency}
                          </Text>
                        </Group>
                      ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">
                    {t('no_data', 'No data')}
                  </Text>
                )}
              </Card>
            </SimpleGrid>

            <Card withBorder radius="md" p="0" style={{ height: '400px', overflow: 'hidden' }}>
              <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredData.markers.map(({ place, tripId, tripName }) => (
                  <Marker key={place.id} position={[parseFloat(place.latitude!), parseFloat(place.longitude!)]}>
                    <Popup>
                      <Stack gap={0}>
                        <Text component={'div'} size="sm">
                          {place.name}
                          <Text component={'div'} size="xs" c="dimmed">
                            {place.stateName}, {place.countryName}
                          </Text>
                        </Text>

                        <Anchor component={Link} to={`/trips/${tripId}`} target="_blank" size="xs">
                          {tripName}
                        </Anchor>
                      </Stack>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </Stack>
        )}
      </Box>
    </Container>
  );
};
export default TravelBoard;
