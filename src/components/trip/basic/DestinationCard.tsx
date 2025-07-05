import { Place, Trip } from '../../../types/trips.ts';
import { IconClock, IconMapPin } from '@tabler/icons-react';
import { Anchor, Badge, Card, Group, HoverCard, Text } from '@mantine/core';
import classes from './DestinationCard.module.css';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';
import { getMapsUrl } from '../../../lib/places.ts';
import { TimezoneInfo } from '../../util/TimezoneInfo.tsx';

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
        <Group>
          <HoverCard width={200} shadow="md">
            <HoverCard.Target>
              <Badge variant={'light'} radius={'sm'} leftSection={<IconClock size={12} />} px={'xs'} size={'sm'}>
                {destination.timezone || 'Unknown'}
              </Badge>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <TimezoneInfo user={user} timezone={destination.timezone} />
            </HoverCard.Dropdown>
          </HoverCard>
        </Group>
      </Card.Section>
    </Card>
  );
};
