import { Anchor, Card, Group, Text } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

import { useCurrentUser } from '@src/auth/useCurrentUser.ts';
import { TimezoneInfo } from '@src/components/util/TimezoneInfo.tsx';
import { getMapsUrl } from '@src/lib/places.ts';

import type { Place, Trip } from '@src/types/trips.ts';

export const DestinationCard = ({ destination }: { destination: Place; trip: Trip }) => {
  const { user } = useCurrentUser();
  return (
    <Card radius="sm" p={0}>
      <Group wrap="nowrap" justify={'space-between'}>
        <Group justify={'start'}>
          <Text fw={500}>{destination.name}</Text>
          <Text fz="xs" c="dimmed">
            {`${destination.stateName ? destination.stateName + ',' : ' '} ${destination.countryName || 'Unspecified'} `}
          </Text>
        </Group>
        <Group justify={'end'}>
          <TimezoneInfo timezone={destination.timezone} />
          <Anchor href={getMapsUrl(user, destination)} target={'_blank'}>
            <IconMapPin stroke={1.5} size={20} />
          </Anchor>
        </Group>
      </Group>
    </Card>
  );
};
