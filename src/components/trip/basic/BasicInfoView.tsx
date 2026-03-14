import { Box, Card, Grid, Group, Progress, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { BasicInfoMenu } from './BasicInfoMenu.tsx';
import { CollaboratorButton } from './collaborators/CollaboratorCard.tsx';
import { DestinationCard } from './DestinationCard.tsx';
import { TravellerCard } from './TravellerCard.tsx';
import { listCollaborators, listTravellerProfiles } from '../../../lib/api';
import { useTripExpenses } from '../expenses/useTripExpenses.ts';

import type { User } from '../../../types/auth.ts';
import type { Trip } from '../../../types/trips.ts';

export const BasicInfoView = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t } = useTranslation();

  const { data: collaborators } = useQuery<User[]>({
    queryKey: ['listCollaborators', trip.id],
    queryFn: () => listCollaborators({ tripId: trip.id }),
  });

  const { data: allTravellerProfiles } = useQuery({
    queryKey: ['traveller_profiles'],
    queryFn: listTravellerProfiles,
  });

  const tripTravellerProfiles = (allTravellerProfiles || []).filter((p) => trip.travellers?.includes(p.id));
  const { convertedExpenses } = useTripExpenses({
    trip: trip,
  });

  const totalExpenses = convertedExpenses?.reduce((sum, exp) => {
    return sum + (exp.convertedCost?.value || 0);
  }, 0);

  const budgetPercentage =
    trip.budget?.value && trip.budget?.value > 0 ? (totalExpenses / trip.budget?.value) * 100 : 0;

  return (
    <>
      <Group justify="flex-end" align="center" wrap="wrap">
        <BasicInfoMenu trip={trip} refetch={refetch} />
      </Group>
      <Grid pt={'md'}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <ScrollArea h={300} scrollbarSize={2} scrollHideDelay={500}>
            <Card withBorder radius="sm" p={'md'} h={300}>
              <Card.Section p={'sm'}>
                <Title order={2}>{trip.name}</Title>
              </Card.Section>

              <Card.Section p={'sm'}>
                <Text size={'sm'}>{`${dayjs(trip.startDate).format('ll')} - ${dayjs(trip.endDate).format('ll')}`}</Text>
              </Card.Section>

              <Card.Section p={'sm'}>
                <Text>{trip.description}</Text>
              </Card.Section>
            </Card>
          </ScrollArea>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="sm" p={'md'} h={300}>
            <Title order={5}>{t('trip_destinations', 'Destinations')}</Title>
            <ScrollArea h={300} scrollbarSize={2} scrollHideDelay={500} pt={'md'}>
              <Stack>
                {(trip.destinations || []).map((destination) => {
                  return <DestinationCard key={destination.id} destination={destination} trip={trip} />;
                })}
              </Stack>
            </ScrollArea>
          </Card>
        </Grid.Col>
        <Grid.Col span={12}>
          <Title order={5}>{t('budget', 'Budget')}</Title>

          {trip.budget?.value && (
            <Card withBorder radius="sm" p={'md'} mt={'md'}>
              <Progress.Root size={42}>
                <Progress.Section value={budgetPercentage}>
                  <Progress.Label>
                    <Text size={'sm'}>
                      {t('budget_percent_spent', '{{ percentage }}% spent', {
                        percentage: budgetPercentage.toFixed(2),
                      })}
                    </Text>
                  </Progress.Label>
                </Progress.Section>
                {/*<Progress.Label>
                  <Text size={'sm'}>{`${budgetPercentage.toFixed(2)} %`}</Text>
                </Progress.Label>*/}
              </Progress.Root>

              <Group>
                <Box mt={'sm'}>
                  <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
                    {t('budget_total', 'Budget')}
                  </Text>

                  <Group gap={0}>
                    <Text fw={700}>{trip.budget.value.toFixed(2)}</Text>
                    <Text fw={700}>&nbsp;</Text>
                    <Text fw={700} size="sm">
                      {` ${trip.budget.currency}`}
                    </Text>
                  </Group>
                </Box>

                <Box mt={'sm'}>
                  <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
                    {t('budget_spent', 'Spent')}
                  </Text>

                  <Group gap={0}>
                    <Text fw={700}>{totalExpenses?.toFixed(2)}</Text>
                    <Text fw={700}>&nbsp;</Text>
                    <Text fw={700} size="sm">
                      {` ${trip.budget.currency}`}
                    </Text>
                  </Group>
                </Box>
              </Group>
            </Card>
          )}
          {!trip.budget?.value && (
            <Card withBorder radius="md" p={'md'} mt={'md'}>
              <Text>{t('no_budget_set', 'No budget set')}</Text>
            </Card>
          )}
        </Grid.Col>
        <Grid.Col span={12}>
          <Title order={5}>{t('trip_travellers', 'Travelers')}</Title>
          {tripTravellerProfiles.length > 0 && (
            <Group mt={'md'}>
              {tripTravellerProfiles.map((profile) => (
                <TravellerCard key={profile.id} profile={profile} />
              ))}
            </Group>
          )}
          {tripTravellerProfiles.length === 0 && (
            <Card withBorder radius={'md'} p={'md'} mt={'md'}>
              <Text>
                {t(
                  'no_travellers_no_access',
                  'No travellers assigned to this trip or you do not have access to the assigned travellers.'
                )}
              </Text>
            </Card>
          )}
        </Grid.Col>

        <Grid.Col span={12}>
          <Title order={5}>{t('trip_collaborators', 'Collaborators')}</Title>
          {collaborators && (
            <Group mt={'sm'}>
              {(collaborators || []).map((person) => {
                return <CollaboratorButton key={person.id} user={person} trip={trip} onSave={() => refetch()} />;
              })}
            </Group>
          )}

          {!collaborators ||
            (collaborators?.length === 0 && (
              <Card withBorder radius={'md'} p={'md'} mt={'sm'}>
                <Text>{t('no_collaborators', 'No collaborators assigned to this trip.')}</Text>
              </Card>
            ))}
        </Grid.Col>
      </Grid>
    </>
  );
};
