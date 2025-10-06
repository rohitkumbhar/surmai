import { Anchor, Card, Group, Text } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

import classes from './DestinationCard.module.css';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { getMapsUrl } from '../../../lib/places.ts';
import { TimezoneInfo } from '../../util/TimezoneInfo.tsx';

import type { Place, Trip } from '../../../types/trips.ts';

export const DestinationCard = ({ destination }: { destination: Place; trip: Trip }) => {
  const { user } = useCurrentUser();
  return (
    <Card withBorder radius="xs" className={classes.card} p={'xs'}>
      <Group justify="space-between">
        <div>
          <Text fw={500}>{destination.name}</Text>
          <Text fz="xs" c="dimmed">
            {`${destination.stateName ? destination.stateName + ',' : ' '} ${destination.countryName || 'Unspecified'} `}
          </Text>
        </div>
        <Anchor href={getMapsUrl(user, destination)} target={'_blank'}>
          <IconMapPin stroke={1.5} />
        </Anchor>
      </Group>

      <Card.Section className={classes.section} mt="xs">
        <TimezoneInfo timezone={destination.timezone} />
      </Card.Section>
    </Card>
  );
};
