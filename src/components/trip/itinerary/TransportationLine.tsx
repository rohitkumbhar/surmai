import { Transportation } from '../../../types/trips.ts';
import { Anchor, Badge, Box, Group, rem, Stack, Text } from '@mantine/core';
import { typeIcons } from '../transportation/typeIcons.ts';
import { IconCar, IconMap2 } from '@tabler/icons-react';
import dayjs, { Dayjs } from 'dayjs';

import { formatTime } from '../../../lib/time.ts';
import { useTranslation } from 'react-i18next';
import { getMapsLink } from '../../../lib/places.ts';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

export const TransportationLine = ({ transportation, day }: { transportation: Transportation; day: Dayjs }) => {
  const type = transportation.type;

  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[type] || IconCar;
  const showStartTime = dayjs(transportation.departureTime).startOf('day').isSame(day);
  const showEndTime = dayjs(transportation.arrivalTime).endOf('day').isSame(day.endOf('day'));
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  return (
    <>
      {type === 'rental_car' && (
        <CarRentalLine rental={transportation} showStartTime={showStartTime} showEndTime={showEndTime} />
      )}
      {type !== 'rental_car' && (
        <Stack bd={'1px solid var(--mantine-primary-color-light)'} gap={0}>
          <Group p={'sm'}>
            <Box visibleFrom={'md'}>
              <TypeIcon
                title={transportation.type}
                style={{
                  color: 'var(--mantine-primary-color-4)',
                  width: rem(20),
                  height: rem(20),
                }}
              />
            </Box>

            {showStartTime && <Badge radius={'xs'}>{formatTime(transportation.departureTime)}</Badge>}
            <Text>
              {t('transportation_from_to', '{{ origin }} to {{ destination }}', {
                origin: transportation.origin,
                destination: transportation.destination,
              })}
            </Text>
            {showEndTime && <Badge radius={'xs'}>{formatTime(transportation.arrivalTime)}</Badge>}
          </Group>
          <Group p={'sm'}>
            {transportation.metadata?.flightNumber && (
              <>
                <Text size={'sm'} c={'dimmed'}>
                  Flight:
                </Text>
                <Text size={'sm'}>{transportation.metadata?.flightNumber}</Text>
              </>
            )}

            {transportation.metadata?.reservation && (
              <>
                <Text size={'sm'} c={'dimmed'}>
                  Confirmation Code:
                </Text>
                <Text size={'sm'}>{` ${transportation.metadata?.reservation}`}</Text>
              </>
            )}
            {transportation.metadata?.seats && (
              <>
                <Text size={'sm'} c={'dimmed'}>{`Seats:`}</Text>
                <Text size={'sm'}>{`${transportation.metadata?.seats}`}</Text>
              </>
            )}
          </Group>
          {transportation.metadata.originAddress && (
            <Group p={'sm'}>
              <Text size={'sm'} c={'dimmed'}>{`Origin:`}</Text>
              <Anchor href={getMapsLink(user, transportation.metadata.originAddress)} target={'_blank'}>
                <Group gap={0}>
                  <Text size={'sm'} c={'var(--mantine-primary-color-9)'}>
                    {transportation.metadata?.originAddress}
                  </Text>
                  <IconMap2 height={14} />
                </Group>
              </Anchor>
            </Group>
          )}

          {transportation.metadata.destinationAddress && (
            <Group p={'sm'}>
              <Text size={'sm'} c={'dimmed'}>{`Destination:`}</Text>
              <Anchor href={getMapsLink(user, transportation.metadata.destinationAddress)} target={'_blank'}>
                <Group gap={0}>
                  <Text size={'sm'} c={'var(--mantine-primary-color-9)'}>
                    {transportation.metadata?.destinationAddress}
                  </Text>
                  <IconMap2 height={14} />
                </Group>
              </Anchor>
            </Group>
          )}
        </Stack>
      )}
    </>
  );
};

const CarRentalLine = ({
  showStartTime,
  showEndTime,
  rental,
}: {
  showStartTime: boolean;
  showEndTime: boolean;
  rental: Transportation;
}) => {
  const { t } = useTranslation();

  if (!(showStartTime || showEndTime)) {
    return null;
  }

  return (
    <Group p={'sm'} bd={'1px solid var(--mantine-primary-color-light)'}>
      <Box visibleFrom={'md'}>
        <IconCar
          title={rental.type}
          style={{
            color: 'var(--mantine-primary-color-4)',
            width: rem(20),
            height: rem(20),
          }}
        />
      </Box>
      {showStartTime && <Badge radius={'xs'}>{formatTime(rental.departureTime)}</Badge>}
      {showStartTime && (
        <Text>{t('pickup_rental_car', 'Pickup rental car from {{ origin }}', { origin: rental.origin })}</Text>
      )}
      {showEndTime && (
        <Text>
          {t('return_rental_car', 'Return rental car to {{ destination }}', { destination: rental.destination })}
        </Text>
      )}
      {showEndTime && <Badge radius={'xs'}>{formatTime(rental.arrivalTime)}</Badge>}
    </Group>
  );
};
