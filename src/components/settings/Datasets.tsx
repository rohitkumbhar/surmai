import { Box, Button, Card, Grid, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countAirlines, countAirports, countPlaces, loadAirlines, loadAirports, loadCities } from '../../lib/api';
import { clearLoadingNotification, showLoadingNotification } from '../../lib/notifications.tsx';


export const Datasets = () => {
  const [cityCount, setCityCount] = useState<number>(0);
  const [airportCount, setAirportCount] = useState<number>(0);
  const [airlineCount, setAirlineCount] = useState<number>(0);

  const { t } = useTranslation();
  useEffect(() => {
    countPlaces().then((count) => setCityCount(count));
    countAirports().then((count) => setAirportCount(count));
    countAirlines().then((count) => setAirlineCount(count));
  }, []);

  const cityLoadConfirmationModal = () =>
    modals.openConfirmModal({
      title: 'Loading Places Dataset',
      children: (
        <Text size="sm">
          {t(
            'places_loading_info',
            'This action will load approximately 150000 places into your database and will take a long time.'
          )}
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {},
      onConfirm: () => {
        const notificationId = showLoadingNotification({
          title: t('dataset', 'Dataset'),
          message: t('loading_places_dataset', 'Loading Places dataset'),
        });
        loadCities().then((results) => {
          clearLoadingNotification({
            id: notificationId,
            title: t('dataset', 'Dataset'),
            message: t('places_loaded', 'Number of places loaded: {{count}}', { count: results.count }),
          });
        });
      },
    });

  const airportsLoadConfirmationModal = () =>
    modals.openConfirmModal({
      title: 'Loading Airports Dataset',
      children: (
        <Text size="sm">
          {t(
            'loading_airports_info',
            'This action will load airport information into your database and will take a long time.'
          )}
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {},
      onConfirm: () => {
        const notificationId = showLoadingNotification({
          title: t('dataset', 'Dataset'),
          message: t('loading_airports_dataset', 'Loading Airports dataset'),
        });

        loadAirports().then((results) => {
          clearLoadingNotification({
            id: notificationId,
            title: t('dataset', 'Dataset'),
            message: t('airports_loaded', 'Number of airports loaded: {{count}}', { count: results.count }),
          });
        });
      },
    });

  const airlinesLoadConfirmationModal = () =>
    modals.openConfirmModal({
      title: 'Loading Airlines Dataset',
      children: (
        <Text size="sm">
          {t(
            'loading_airlines_info',
            'This action will load airline information into your database and will take a long time.'
          )}
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {},
      onConfirm: () => {
        const notificationId = showLoadingNotification({
          title: t('dataset', 'Dataset'),
          message: t('loading_airlines_dataset', 'Loading Airlines dataset'),
        });

        loadAirlines().then((results) => {
          clearLoadingNotification({
            id: notificationId,
            title: t('dataset', 'Dataset'),
            message: t('airlines_loaded', 'Number of airlines loaded: {{count}}', { count: results.count }),
          });
        });
      },
    });

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        {t('dataset_section', 'Datasets')}
      </Title>
      <Text fz="xs" c="dimmed" mt={3} mb="xl">
        {t('dataset_section_description', 'Load available datasets')}
      </Text>

      <Grid grow={false}>
        <Grid.Col span={{ base: 12, sm: 12, md: 8, lg: 10 }}>
          <div>
            <Text>{t('world_places_dataset', 'World Places')}</Text>
            <Text size="sm" c="dimmed">
              {t(
                'places_dataset_info',
                'A list of possible destinations. This list requires a manual loading action since it may take a long time to load.'
              )}
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 12, md: 4, lg: 2 }}>
          {cityCount > 0 && (
            <Box size="md">
              {cityCount}
              <Text size="sm" c="dimmed">
                {t('places_available_suffix', 'Places Available')}
              </Text>
            </Box>
          )}
          {cityCount === 0 && <Button onClick={cityLoadConfirmationModal}>{t('load_places', 'Load Places')}</Button>}
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 12, md: 8, lg: 10 }}>
          <div>
            <Text>{t('world_airports_dataset', 'World Airports')}</Text>
            <Text size="sm" c="dimmed">
              {t('airport_dataset_info', 'A list of medium and large airports around the world.')}
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 12, md: 4, lg: 2 }}>
          {airportCount > 0 && (
            <Text component={'div'} size="md">
              {airportCount || 0}
              <Text size="sm" c="dimmed">
                {t('airports_available_suffix', 'Airports Available')}
              </Text>
            </Text>
          )}
          {airportCount === 0 && (
            <Button onClick={airportsLoadConfirmationModal}>{t('load_airports', 'Load Airports')}</Button>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 12, md: 8, lg: 10 }}>
          <div>
            <Text>{t('world_airline_dataset', 'World Airlines')}</Text>
            <Text size="sm" c="dimmed">
              {t('airline_dataset_info', 'A list of airlines around the world.')}
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 12, md: 4, lg: 2 }}>
          {airlineCount > 0 && (
            <Text component={'div'} size="md">
              {airlineCount || 0}
              <Text size="sm" c="dimmed">
                {t('airlines_available_suffix', 'Airlines Available')}
              </Text>
            </Text>
          )}
          {airlineCount === 0 && (
            <Button onClick={airlinesLoadConfirmationModal}>{t('load_airlines', 'Load Airlines')}</Button>
          )}
        </Grid.Col>
      </Grid>
    </Card>
  );
};
