import {
  ActionIcon,
  AspectRatio,
  Card,
  Container,
  Divider,
  LoadingOverlay,
  SimpleGrid,
  Text,
} from '@mantine/core';
import classes from './MyTrips.module.css';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { listTrips } from '../../lib';
import { useQuery } from '@tanstack/react-query';
import { Trip } from '../../types/trips.ts';
import { TripCard } from '../../components/trip/TripCard.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import {ErrorInfo} from "react";

export const MyTrips = () => {
  const navigate = useNavigate();
  const { isPending, isError, data, error } = useQuery<Trip[]>({
    queryKey: ['my_trips'],
    queryFn: listTrips,
  });

  if (isPending) {
    return (
      <LoadingOverlay
        visible={true}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
    );
  }

  if (isError) {
    throw new Error(error.message);
  }

  const logError = (error: Error, info: ErrorInfo) => {
    // Do something with the error, e.g. log to an external API
    console.log(error);
    console.log(' info', info);
  };

  const cards = () => {
    return data.map((trip) => (
      <ErrorBoundary key={trip.id} onError={logError} fallback={<p>Wrong!</p>}>
        <TripCard trip={trip} />
      </ErrorBoundary>
    ));
  };

  const createNew = (
    <Card
      key={'create_new'}
      p="md"
      radius="md"
      component="a"
      href="#"
      className={classes.card}
      onClick={(event) => {
        navigate('/trips/create');
        event.preventDefault();
      }}
    >
      <AspectRatio ratio={1920 / 400}>
        <ActionIcon
          variant="filled"
          aria-label="Settings"
          style={{ height: '100%' }}
        >
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
    <Container py="xl">
      <Text size="xl" tt="uppercase" fw={700} mt="md" mb="md">
        My Trips
      </Text>
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
