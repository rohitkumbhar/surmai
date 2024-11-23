import { useParams } from 'react-router-dom';
import { Accordion, Alert, Container, Group, LoadingOverlay, rem, Text } from '@mantine/core';
import { IconBed, IconCalendar, IconInfoSquare, IconPlane, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { Trip } from '../../types/trips.ts';
import { formatDate, getTrip } from '../../lib';
import { Header } from '../../components/nav/Header.tsx';
import { BasicInfo } from '../../components/trip/basic/BasicInfo.tsx';
import { useQuery } from '@tanstack/react-query';
import { TransportationPanel } from '../../components/trip/transportation/TransportationPanel.tsx';
import { useTranslation } from 'react-i18next';
import { useDisclosure, useDocumentTitle, useLocalStorage, useNetwork } from '@mantine/hooks';
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

  const { online } = useNetwork();
  const [showAlert, { close: closeAlert }] = useDisclosure(true);
  const [offlineCacheTimestamp] = useLocalStorage<string | null>({
    key: `offline-cache-timestamp-${tripId}`,
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
    throw error;
  }

  const trip = data;
  return (
    <Container py={'sm'} size="xl">
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

      {online && offlineCacheTimestamp && showAlert && (
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

      {!online && offlineCacheTimestamp && showAlert && (
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

      {!online && !offlineCacheTimestamp && showAlert && (
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
