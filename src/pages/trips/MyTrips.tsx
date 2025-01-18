import { ActionIcon, AspectRatio, Card, Container, Divider, LoadingOverlay, SimpleGrid, Text } from '@mantine/core';
import classes from './MyTrips.module.css';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { listTrips } from '../../lib';
import { useQuery } from '@tanstack/react-query';
import { Trip } from '../../types/trips.ts';
import { TripCard } from '../../components/trip/TripCard.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorInfo } from 'react';
import { Header } from '../../components/nav/Header.tsx';
import { useTranslation } from 'react-i18next';

export const MyTrips = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isPending, isError, data, error } = useQuery<Trip[]>({
    queryKey: ['my_trips'],
    queryFn: listTrips,
  });

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw error;
  }

  const logError = (error: Error, info: ErrorInfo) => {
    // Do something with the error, e.g. log to an external API
    console.log(error, info);
  };

  const cards = () => {
    return data.map((trip) => (
      <ErrorBoundary key={trip.id} onError={logError} fallback={<p>Uh oh!</p>}>
        {trip && <TripCard trip={trip} />}
      </ErrorBoundary>
    ));
  };

  const createNew = (
    <Card
      key={'create_new'}
      withBorder
      radius={'md'}
      p={'md'}
      component="a"
      href="#"
      className={classes.card}
      onClick={(event) => {
        navigate('/trips/create');
        event.preventDefault();
      }}
    >
      <AspectRatio ratio={1920 / 800}>
        <ActionIcon variant="filled" aria-label="Settings" style={{ height: '100%' }}>
          <IconPlus stroke={1.5} />
        </ActionIcon>
      </AspectRatio>
      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
        {'Near Future'}
      </Text>
      <Text className={classes.title} mt={5}>
        {'Start An Amazing Adventure'}
      </Text>
    </Card>
  );

  return (
    <Container py="xl" size={'xl'}>
      <Header>
        <Text size={'md'} mt={'md'}>
          {t('all_trips', 'All Trips')}
        </Text>
      </Header>
      <SimpleGrid mb={'md'} cols={{ base: 1, sm: 2, md: 3 }}>
        {[createNew]}
      </SimpleGrid>
      <Divider />
      <SimpleGrid mt={'md'} cols={{ base: 1, sm: 2, md: 3 }}>
        {data && cards()}
      </SimpleGrid>
    </Container>
  );
};
