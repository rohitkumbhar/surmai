import { Trip } from '../../../types/trips.ts';
import { useTranslation } from 'react-i18next';
import { Divider, Flex, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { formatDate } from '../../../lib';
import { ParticipantData } from './ParticipantData.tsx';
import { BasicInfoMenu } from './BasicInfoMenu.tsx';

export const BasicInfoView = ({ trip, refetch }: { trip: Trip; refetch: () => void }) => {
  const { t, i18n } = useTranslation();

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
      <Text mt={'md'}>{t('basic.destinations', 'Destinations')}</Text>
      <Group>
        {(trip.destinations || []).map((destination) => {
          return (
            <Group wrap={'nowrap'} key={destination.id}>
              <Paper
                shadow="sm"
                p={'xs'}
                radius="xs"
                mih={75}
                miw={'250px'}
                bd={'1px solid var(--mantine-primary-color-2)'}
              >
                <Text>{destination.name}</Text>
                {
                  <Text
                    mt={'xs'}
                    c={'dimmed'}
                    size={'xs'}
                  >{`${destination.stateName || ''} ${destination.countryName || ''} `}</Text>
                }
              </Paper>
            </Group>
          );
        })}
      </Group>
      <Divider />
      <Text mt={'md'}>{t('basic.travellers', 'Travellers')}</Text>
      <Group>
        {(trip.participants || []).map((person, index) => {
          return (
            <Group wrap={'nowrap'} key={person.name}>
              <ParticipantData participant={person} trip={trip} index={index} refetch={refetch} />
            </Group>
          );
        })}
      </Group>
    </Stack>
  );
};
