import { useParams } from 'react-router-dom';
import { Accordion, Container, Group, LoadingOverlay, rem, Text } from '@mantine/core';
import { IconBed, IconCalendar, IconInfoSquare, IconPlane } from '@tabler/icons-react';
import { Trip } from '../../types/trips.ts';
import { formatDate, getTrip } from '../../lib';
import { Header } from '../../components/nav/Header.tsx';
import { BasicInfo } from '../../components/trip/basic/BasicInfo.tsx';
import { useQuery } from '@tanstack/react-query';
import { TransportationPanel } from '../../components/trip/transportation/TransportationPanel.tsx';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { LodgingPanel } from '../../components/trip/lodging/LodgingPanel.tsx';
import { ActivitiesPanel } from '../../components/trip/activities/ActivitiesPanel.tsx';

export const ViewTrip = () => {
  const [docTitle, setDocTitle] = useState('Trip Details');
  useDocumentTitle(docTitle);
  const { tripId } = useParams();
  const { t, i18n } = useTranslation();
  const { isPending, isError, data, error, refetch } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  });

  useEffect(() => {
    if (data) {
      setDocTitle(data.name);
    }
  }, [data]);

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw new Error(error.message);
  }
  const trip = data;
  return (
    <Container py={'xl'} size="lg">
      <Header>
        <Group>
          <Text size={'sm'} px={'md'}>
            {trip?.name}
          </Text>
          <Text size={'sm'} visibleFrom={'sm'} c={'dimmed'}>
            {formatDate(i18n.language, trip.startDate)} - {formatDate(i18n.language, trip.endDate)}
          </Text>
        </Group>
      </Header>

      <Accordion chevronPosition="right" variant="separated" multiple={true}>
        <Accordion.Item value={'basic_info'} key={'basic_info'}>
          <Accordion.Control
            icon={
              <IconInfoSquare
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(40),
                  height: rem(40),
                }}
              />
            }
          >
            <Group wrap="nowrap">
              <div>
                <Text>{t('basic.section_name', 'Basic Information')}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {t('basic.section_description', 'View basic information about your trip')}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <BasicInfo trip={trip} refetch={refetch} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={'transportation'} key={'transportation'}>
          <Accordion.Control
            icon={
              <IconPlane
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(40),
                  height: rem(40),
                }}
              />
            }
          >
            <Group wrap="nowrap">
              <div>
                <Text>{t('transportation.section_name', 'Transportation')}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {t(
                    'transportation.section_description',
                    'View and edit your transportation arrangements for this trip'
                  )}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <TransportationPanel trip={trip} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={'lodging'} key={'lodging'}>
          <Accordion.Control
            icon={
              <IconBed
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(40),
                  height: rem(40),
                }}
              />
            }
          >
            <Group wrap="nowrap">
              <div>
                <Text>{t('lodging.section_name', 'Lodging')}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {t('lodging.section_description', 'View and edit your lodging arrangements for this trip')}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <LodgingPanel trip={trip} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value={'activities'} key={'activities'}>
          <Accordion.Control
            icon={
              <IconCalendar
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(40),
                  height: rem(40),
                }}
              />
            }
          >
            <Group wrap="nowrap">
              <div>
                <Text>{t('activities.section_name', 'Activities')}</Text>
                <Text size="sm" c="dimmed" fw={400}>
                  {t('activities.section_description', 'View and edit your activities for this trip')}
                </Text>
              </div>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <ActivitiesPanel trip={trip} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
};
