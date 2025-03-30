import { useParams } from 'react-router-dom';
import { Accordion, Alert, Container, Group, LoadingOverlay, rem, Tabs, Text } from '@mantine/core';
import { IconBed, IconCalendar, IconInfoSquare, IconPlane, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { Trip } from '../../types/trips.ts';
import { getTrip } from '../../lib/api';
import { Header } from '../../components/nav/Header.tsx';
import { BasicInfo } from '../../components/trip/basic/BasicInfo.tsx';
import { useQuery } from '@tanstack/react-query';
import { TransportationPanel } from '../../components/trip/transportation/TransportationPanel.tsx';
import { useTranslation } from 'react-i18next';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { LodgingPanel } from '../../components/trip/lodging/LodgingPanel.tsx';
import { ActivitiesPanel } from '../../components/trip/activities/ActivitiesPanel.tsx';
import { ItineraryView } from '../../components/trip/itinerary/ItineraryView.tsx';
import { formatDate } from '../../lib/time.ts';
import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';
import { TripNotes } from '../../components/trip/notes/TripNotes.tsx';

export const ViewTrip = () => {
  const [docTitle, setDocTitle] = useState('Trip Details');
  usePageTitle(docTitle);

  const { offline } = useSurmaiContext();
  const { tripId } = useParams();
  const { t, i18n } = useTranslation();
  const {
    isPending,
    isError,
    data: trip,
    error,
    refetch,
  } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  });

  const [showAlert, { close: closeAlert }] = useDisclosure(true);
  const [offlineCacheTimestamp] = useLocalStorage<string | null>({
    key: `offline-cache-timestamp-${tripId}`,
  });

  useEffect(() => {
    if (trip) {
      setDocTitle(trip.name);
    }
  }, [trip]);

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <Container py={'sm'} size="xl">
      <Header>
        <Group mt={'md'}>
          <Text size={'md'}>{trip?.name}</Text>
          <Text size={'sm'} visibleFrom={'sm'} c={'dimmed'}>
            {formatDate(i18n.language, trip.startDate)} - {formatDate(i18n.language, trip.endDate)}
          </Text>
        </Group>
      </Header>

      {!offline && offlineCacheTimestamp && showAlert && (
        <Alert
          variant="light"
          title={t('offline_access', 'Offline Access')}
          icon={<IconRefresh />}
          mb="sm"
          onClose={closeAlert}
          withCloseButton
          closeButtonLabel={t('dismiss', 'Dismiss')}
        >
          {t('offline_sync_status', 'Trip data was synced to this device at {{offlineCacheTimestamp}}', {
            offlineCacheTimestamp: offlineCacheTimestamp,
          })}
        </Alert>
      )}

      {offline && offlineCacheTimestamp && showAlert && (
        <Alert
          variant="light"
          title={t('offline', 'Offline')}
          icon={<IconWifiOff />}
          mb="sm"
          onClose={closeAlert}
          withCloseButton
          closeButtonLabel={t('dismiss', 'Dismiss')}
        >
          {t('offline_data_display', 'Showing trip data synced at {{offlineCacheTimestamp}}', {
            offlineCacheTimestamp: offlineCacheTimestamp,
          })}
        </Alert>
      )}

      {offline && !offlineCacheTimestamp && showAlert && (
        <Alert
          variant="light"
          title={t('offline', 'Offline')}
          icon={<IconWifiOff />}
          mb="sm"
          onClose={closeAlert}
          withCloseButton
          closeButtonLabel={t('dismiss', 'Dismiss')}
        >
          {t('offline_no_data', 'Trip data may not be available.')}
        </Alert>
      )}

      <Tabs defaultValue="organization">
        <Tabs.List>
          <Tabs.Tab value="organization">{t('organization', 'Organization')}</Tabs.Tab>
          <Tabs.Tab value="itinerary">{t('itinerary', 'Itinerary')}</Tabs.Tab>
          <Tabs.Tab value="notes">{t('notes', 'Notes')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="organization">
          <Accordion chevronPosition="right" variant="separated" multiple={true} mt={'sm'}>
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
                    <Text>{t('trip_basic_information', 'Basic Information')}</Text>
                    <Text size="sm" c="dimmed" fw={400}>
                      {t('trip_basic_info_description', 'View basic information about your trip')}
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
                    <Text>{t('transportation_section_name', 'Transportation')}</Text>
                    <Text size="sm" c="dimmed" fw={400}>
                      {t(
                        'transportation_section_description',
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
                    <Text>{t('lodging_section_name', 'Lodging')}</Text>
                    <Text size="sm" c="dimmed" fw={400}>
                      {t('lodging_section_description', 'View and edit your lodging arrangements for this trip')}
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
                    <Text>{t('activity_section_name', 'Activities')}</Text>
                    <Text size="sm" c="dimmed" fw={400}>
                      {t('activity_section_description', 'View and edit your activities for this trip')}
                    </Text>
                  </div>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <ActivitiesPanel trip={trip} />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Tabs.Panel>
        <Tabs.Panel value="itinerary">
          <ItineraryView trip={trip} />
        </Tabs.Panel>
        <Tabs.Panel value="notes">
          <TripNotes refetch={refetch} trip={trip} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
