import { Box, Button, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { formatDateShort, formatTime } from '../../../lib/time.ts';
import { IconArrowRight } from '@tabler/icons-react';
import { Transportation } from '../../../types/trips.ts';
import { CopyDataButton } from './CopyDataButton.tsx';

export const FlightCard = ({ flight }: { flight: Transportation }) => {
  return (
    <Card withBorder radius="md" maw={500}>
      <Card.Section pt={'md'}>
        <Group justify={'space-evenly'}>
          <Stack align={'center'} gap={'xs'}>
            <Button size={'lg'} variant={'outline'}>
              {flight.metadata?.origin?.iataCode || flight.origin}
            </Button>
            <Box>
              <Text size={'sm'}>{formatDateShort(flight.departureTime)}</Text>
              <Text size={'sm'}>{formatTime(flight.departureTime)}</Text>
            </Box>
          </Stack>

          <Box visibleFrom={'md'}>
            <IconArrowRight />
          </Box>
          <Stack align={'center'} gap={'xs'}>
            <Button size={'lg'} variant={'outline'}>
              {flight.metadata?.destination?.iataCode || flight.destination}
            </Button>
            <Box>
              <Text size={'sm'}>{formatDateShort(flight.arrivalTime)}</Text>
              <Text size={'sm'}>{formatTime(flight.arrivalTime)}</Text>
            </Box>
          </Stack>
        </Group>
        <Divider />
      </Card.Section>
      {flight.metadata?.originAddress && (
        <Card.Section px={'sm'} pt={'xs'}>
          <Text size={'sm'}>{`${flight.metadata?.originAddress}`}</Text>
          <Divider />
        </Card.Section>
      )}
      {flight.metadata?.destinationAddress && (
        <Card.Section px={'sm'} pt={'xs'}>
          <Text size={'sm'}>{`${flight.metadata?.destinationAddress}`}</Text>
          <Divider />
        </Card.Section>
      )}
      <Card.Section>
        <Group gap={'xs'} px={'sm'}>
          {flight?.metadata?.reservation && <CopyDataButton text={flight?.metadata?.reservation} />}
          {flight?.metadata?.flightNumber && <CopyDataButton text={flight?.metadata?.flightNumber} />}
          {flight?.metadata?.seats && <CopyDataButton text={flight?.metadata?.seats} />}
          {flight?.metadata?.provider?.name && <CopyDataButton text={flight?.metadata?.provider?.name} />}
        </Group>
      </Card.Section>
    </Card>
  );
};
