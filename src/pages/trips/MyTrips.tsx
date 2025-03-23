import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core';
import classes from './MyTrips.module.css';
import { useNavigate } from 'react-router-dom';
import { listPastTrips, listUpcomingTrips } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Trip } from '../../types/trips.ts';
import { TripCard } from '../../components/trip/TripCard.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '../../components/nav/Header.tsx';
import { useTranslation } from 'react-i18next';
import { ImportTripAction } from '../../components/trip/ImportTripAction.tsx';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';
import { showErrorNotification } from '../../lib/notifications.tsx';

export const MyTrips = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t('all_trips', 'All Trips'));

  const {
    isPending: upcomingTripsPending,
    data: upcomingTrips,
    error: upcomingTripsError,
    refetch: upcomingTripsRefetch,
  } = useQuery<Trip[]>({
    queryKey: ['upcoming_trips'],
    queryFn: listUpcomingTrips,
  });

  const {
    isPending: pastTripsPending,
    data: pastTrips,
    refetch: pastTripsRefetch,
    // error: pastTripsError,
  } = useQuery<Trip[]>({
    queryKey: ['past_trips'],
    queryFn: listPastTrips,
  });

  if (upcomingTripsError) {
    throw upcomingTripsError;
  }

  const logError = (error: Error) => {
    showErrorNotification({
      title: t('error', 'Error'),
      error: error,
      message: t('loading_trip_failed', 'Failed to load trip information'),
    });
  };

  const cards = (data: Trip[]) => {
    return data?.map((trip) => (
      <ErrorBoundary key={trip.id} onError={logError} fallback={<p>Uh oh!</p>}>
        {trip && (
          <TripCard
            trip={trip}
            onSave={async () => {
              await upcomingTripsRefetch();
              await pastTripsRefetch();
            }}
          />
        )}
      </ErrorBoundary>
    ));
  };

  return (
    <Container py="xl" size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('all_trips', 'All Trips')}
        </Text>
      </Header>
      <Paper withBorder radius="md" p="xl" bg={'var(--mantine-color-body)'}>
        <Group justify={'space-between'}>
          <div>
            {/*<TextInput name={'Search'} placeholder={'Search...'} leftSection={<IconSearch />} miw={'200'} />*/}
          </div>
          <Flex mih={30} justify="flex-end" align="center" wrap="wrap" pos={'relative'}>
            <Group>
              <ImportTripAction />
              <Button
                onClick={(event) => {
                  navigate('/trips/create');
                  event.preventDefault();
                }}
              >
                {t('start_new_trip', 'New Trip')}
              </Button>
            </Group>
          </Flex>
        </Group>
        <Divider mt={'md'} />
        <Group>
          <Title order={3} className={classes.title} ta="start" mt="sm">
            {t('upcoming_trips', 'Upcoming Trips')}
            <Text size={'xs'} c={'dimmed'}>
              All future trips ordered by start date
            </Text>
          </Title>
        </Group>

        <Box>
          <LoadingOverlay
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            visible={upcomingTripsPending}
            loaderProps={{ type: 'bars' }}
          />
          {upcomingTrips && upcomingTrips.length === 0 && (
            <Card mt={'md'} w={'100%'} bd={'1px dashed var(--mantine-primary-color-7)'} mih={150}>
              <Card.Section m={'auto'}>
                <Box ta={'center'}>
                  <Text>{t('upcoming_trip_no_content', 'No upcoming trips.')}</Text>
                  <Button
                    mt={'md'}
                    onClick={(event) => {
                      navigate('/trips/create');
                      event.preventDefault();
                    }}
                  >
                    {t('start_new_trip', 'New Trip')}
                  </Button>
                </Box>
              </Card.Section>
            </Card>
          )}

          {upcomingTrips && upcomingTrips.length > 0 && (
            <SimpleGrid mt={'md'} cols={{ base: 1, sm: 3, md: 4 }}>
              {upcomingTrips && cards(upcomingTrips)}
            </SimpleGrid>
          )}
        </Box>

        <Divider mt={'md'} />
        <Title order={3} className={classes.title} ta="start" mt="xl">
          {t('past_trips', 'Past Trips')}
          <Text size={'xs'} c={'dimmed'}>
            In the last 12 months
          </Text>
        </Title>
        <Box>
          <LoadingOverlay
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            visible={pastTripsPending}
            loaderProps={{ type: 'bars' }}
          />

          {pastTrips && pastTrips.length === 0 && (
            <Card mt={'md'} w={'100%'} bd={'1px dashed var(--mantine-primary-color-7)'} mih={150}>
              <Card.Section m={'auto'}>
                <Box ta={'center'}>
                  <Text>{t('past_trip_no_content', 'No trips in the past year.')}</Text>
                  {/*<Button mt={'md'}>{t('load_older_trips', 'Load All Trips')}</Button>*/}
                </Box>
              </Card.Section>
            </Card>
          )}
          {pastTrips && pastTrips.length > 0 && (
            <SimpleGrid mt={'md'} cols={{ base: 1, sm: 3, md: 4 }}>
              {pastTrips && cards(pastTrips)}
            </SimpleGrid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};
