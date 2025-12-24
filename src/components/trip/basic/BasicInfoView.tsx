import { Divider, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { listCollaborators, listExpenses } from '../../../lib/api';
import { BasicInfoMenu } from './BasicInfoMenu.tsx';
import { CollaboratorButton } from './collaborators/CollaboratorCard.tsx';
import { DestinationCard } from './DestinationCard.tsx';
import { ParticipantData } from './ParticipantData.tsx';

import type { User } from '../../../types/auth.ts';
import type { Expense, Trip } from '../../../types/trips.ts';
import { useTripExpenses } from '../expenses/useTripExpenses.ts';

export const BasicInfoView = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();

  const { data: collaborators } = useQuery<User[]>({
    queryKey: ['listCollaborators', trip.id],
    queryFn: () => listCollaborators({ tripId: trip.id }),
  });

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ['listExpenses', trip.id],
    queryFn: () => listExpenses(trip.id),
  });

  const { convertedExpenses } = useTripExpenses({
    trip: trip,
  });

  const totalExpenses = convertedExpenses
    ?.reduce((sum, exp) => {
      return sum + (exp.convertedCost?.value || 0);
    }, 0)
    ?.toFixed(2);

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
      <Text size={'sm'}>{`${dayjs(trip.startDate).format('ll')} - ${dayjs(trip.endDate).format('ll')}`}</Text>
      <Divider />
      <Group>
        <Text>
          {t('budget', 'Budget')}:{' '}
          {trip.budget?.value ? `${trip.budget.value} ${trip.budget.currency}` : t('no_budget_set', 'No budget set')}
        </Text>
        <Text>
          {t('spent', 'Spent')}: {totalExpenses}{' '}
          {trip.budget?.currency || (expenses && expenses[0]?.cost?.currency) || ''}
        </Text>
      </Group>
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
      <Text mt={'md'}>{t('trip_travellers', 'Travelers')}</Text>
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
