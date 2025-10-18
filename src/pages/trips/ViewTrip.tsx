import { Alert, Container, Group, LoadingOverlay, Tabs, Text } from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { useSurmaiContext } from '../../app/useSurmaiContext.ts';
import { Header } from '../../components/nav/Header.tsx';
import { TripAttachments } from '../../components/trip/attachments/TripAttachments.tsx';
import { ItineraryView } from '../../components/trip/itinerary/ItineraryView.tsx';
import { TripNotes } from '../../components/trip/notes/TripNotes.tsx';
import { OrganizationTab } from '../../components/trip/OrganizationTab.tsx';
import { getTrip, getTripAttachments } from '../../lib/api';
import { usePageTitle } from '../../lib/hooks/usePageTitle.ts';
import { formatDate } from '../../lib/time.ts';

import type { Attachment, Trip } from '../../types/trips.ts';

import './ViewTrip.module.css';

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
    refetch: refetchTrip,
  } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId || ''),
  });

  const {
    data: tripAttachments,
    refetch: refetchAttachments,
    isPending: attachmentsPending,
  } = useQuery<Attachment[]>({
    queryKey: ['getTripAttachments', tripId],
    queryFn: () => getTripAttachments(tripId || ''),
  });

  const [showAlert, { close: closeAlert }] = useDisclosure(true);
  const [offlineCacheTimestamp] = useLocalStorage<string | null>({
    key: `offline-cache-timestamp-${tripId}`,
  });

  const [activeTab, setActiveTab] = useState<string | null>('organization');

  useEffect(() => {
    if (trip) {
      setDocTitle(trip.name);
    }
  }, [trip]);

  if (isPending || attachmentsPending) {
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

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="organization">{t('organization', 'Organization')}</Tabs.Tab>
          <Tabs.Tab value="itinerary">{t('itinerary', 'Itinerary')}</Tabs.Tab>
          <Tabs.Tab value="attachments">{t('attachments', 'Attachments')}</Tabs.Tab>
          <Tabs.Tab value="notes">{t('notes', 'Notes')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="organization">
          <OrganizationTab
            trip={trip}
            tripAttachments={tripAttachments || []}
            refetchTrip={() => {
              refetchTrip().then(() => refetchAttachments());
            }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="itinerary">
          <ItineraryView trip={trip} />
        </Tabs.Panel>
        <Tabs.Panel value="attachments">
          <TripAttachments
            trip={trip}
            tripAttachments={tripAttachments}
            refetchTrip={async () => {
              await refetchTrip();
              return await refetchAttachments();
            }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="notes">
          <TripNotes refetch={refetchTrip} trip={trip} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
