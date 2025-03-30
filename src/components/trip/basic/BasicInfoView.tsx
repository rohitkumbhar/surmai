import { Trip } from '../../../types/trips.ts';
import { useTranslation } from 'react-i18next';
import { Divider, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { ParticipantData } from './ParticipantData.tsx';
import { BasicInfoMenu } from './BasicInfoMenu.tsx';
import { DestinationCard } from './DestinationCard.tsx';
import { formatDate } from '../../../lib/time.ts';
import { CollaboratorButton } from './collaborators/CollaboratorCard.tsx';
import { useQuery } from '@tanstack/react-query';
import { listCollaborators } from '../../../lib/api';
import { User } from '../../../types/auth.ts';

export const BasicInfoView = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t, i18n } = useTranslation();

  const { data: collaborators } = useQuery<User[]>({
    queryKey: ['listCollaborators', trip.id],
    queryFn: () => listCollaborators({ tripId: trip.id }),
  });

  return (
    <Stack gap={'md'}>
      <Flex mih={30} justify="flex-end" align="center" wrap="wrap" pos={'relative'} top={'20px'}>
        <BasicInfoMenu trip={trip} refetch={refetch} />
      </Flex>
      <Title order={1}>{trip.name}</Title>
      <Title order={4} fw={400}>
        {' '}
        {trip.description}
      </Title>
      <Text size={'sm'}>
        {formatDate(i18n.language, trip.startDate)} - {formatDate(i18n.language, trip.endDate)}
      </Text>
      <Divider />
      <Text mt={'md'}>{t('trip_destinations', 'Destinations')}</Text>
      <Group>
        {(trip.destinations || []).map((destination) => {
          return (
            <Group wrap={'nowrap'} key={destination.id}>
              <DestinationCard destination={destination} trip={trip} />
            </Group>
          );
        })}
      </Group>
      <Divider />
      <Text mt={'md'}>{t('trip_travellers', 'Travellers')}</Text>
      <Group>
        {(trip.participants || []).map((person, index) => {
          return (
            <Group wrap={'nowrap'} key={person.name}>
              <ParticipantData participant={person} trip={trip} index={index} refetch={refetch} />
            </Group>
          );
        })}
      </Group>

      <Text mt={'md'}>{t('trip_collaborators', 'Collaborators')}</Text>
      <Group>
        {collaborators &&
          (collaborators || []).map((person) => {
            return (
              <Group key={person.id}>
                <CollaboratorButton user={person} trip={trip} onSave={() => refetch()} />
              </Group>
            );
          })}
      </Group>
    </Stack>
  );
};
