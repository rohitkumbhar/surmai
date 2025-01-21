import { Box, Button, Card, Grid, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { countAirports, countPlaces, loadAirports, loadCities } from '../../lib/api';
import { modals } from '@mantine/modals';
import { clearLoadingNotification, showLoadingNotification } from '../../lib/notifications.tsx';
import { useTranslation } from 'react-i18next';

export const Datasets = () => {
  const [cityCount, setCityCount] = useState<number>(0);
  const [airportCount, setAirportCount] = useState<number>(0);
  const { t } = useTranslation();
  useEffect(() => {
    countPlaces().then((count) => setCityCount(count));
    countAirports().then((count) => setAirportCount(count));
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

  return (
    <Card withBorder radius="md" p="xl" mt={'md'}>
      <Title order={3} fw={500}>
        {t('dataset_section_title', 'Datasets')}
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
      </Grid>
    </Card>
  );
};
