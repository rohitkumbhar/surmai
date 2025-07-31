import { Card, Container, Flex, LoadingOverlay, Modal, Stack, Text, Title } from '@mantine/core';
import { Attachment, Transportation, Trip } from '../../../types/trips.ts';
import { AddTransportationMenu } from './AddTransportationMenu.tsx';
import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTransportations } from '../../../lib/api';
import { CarRentalData } from './CarRentalData.tsx';
import { GenericTransportationData } from './GenericTransportationData.tsx';
import { useTranslation } from 'react-i18next';
import { GenericTransportationModeForm } from './GenericTransportationModeForm.tsx';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { CarRentalForm } from './CarRentalForm.tsx';
import { FlightForm } from './FlightForm.tsx';
import { FlightData } from './FlightData.tsx';

export const TransportationPanel = ({
  trip,
  tripAttachments,
  refetchTrip,
}: {
  trip: Trip;
  tripAttachments?: Attachment[];
  refetchTrip: () => void;
}) => {
  const { t } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [carRentalFormOpened, { open: openRentalForm, close: closeRentalForm }] = useDisclosure(false);
  const [flightFormOpened, { open: openFlightForm, close: closeFlightForm }] = useDisclosure(false);

  const [newTransportationType, setNewTransportationType] = useState<string>('flight');
  const isMobile = useMediaQuery('(max-width: 50em)');
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<Transportation[]>({
    queryKey: ['listTransportations', tripId],
    queryFn: () => listTransportations(tripId || ''),
  });

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw new Error(error.message);
  }

  const rentalAgreements = (data || []).filter((t) => t.type === 'rental_car');
  const tickets = (data || []).filter((t) => t.type !== 'rental_car');

  const refetchData = () => {
    return refetch().then(() => refetchTrip());
  };

  return (
    <Container p={'xs'} size="xl">
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="auto"
        title={`${t('transportation_add_new', 'Add new')} ${t(newTransportationType, '{{ type }}', { type: newTransportationType })}`}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericTransportationModeForm
          transportationType={newTransportationType}
          trip={trip}
          onSuccess={() => {
            refetchData().then(() => closeForm());
          }}
          onCancel={() => {
            closeForm();
          }}
        />
      </Modal>

      <Modal
        opened={flightFormOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('transportation_add_new_flight', 'Add new flight')}
        onClose={() => {
          closeForm();
        }}
      >
        <FlightForm
          trip={trip}
          onSuccess={() => {
            refetchData().then(() => closeFlightForm());
          }}
          onCancel={() => {
            closeFlightForm();
          }}
        />
      </Modal>

      <Modal
        opened={carRentalFormOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('transportation_add_rental_car', 'Add Rental Car')}
        onClose={() => {
          closeRentalForm();
        }}
      >
        <CarRentalForm
          trip={trip}
          onSuccess={() => {
            refetchData().then(() => closeRentalForm());
          }}
          onCancel={() => {
            closeRentalForm();
          }}
        />
      </Modal>

      <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
        <AddTransportationMenu
          onClick={(type) => {
            if (type === 'car_rental') {
              openRentalForm();
            } else if (type === 'flight') {
              openFlightForm();
            } else {
              setNewTransportationType(type);
              openForm();
            }
          }}
        />
      </Flex>
      <Stack mt={'sm'}>
        <Title order={5}>{t('transportation_travel_timeline', 'Travel Timeline')}</Title>
        {tickets.length === 0 && (
          <Card withBorder>
            <Text c={'dimmed'}>{t('transportation_no_tickets', 'No Tickets')}</Text>
          </Card>
        )}
        {tickets.map((t: Transportation) => {
          return (
            <Fragment key={t.id}>
              {t.type === 'flight' && (
                <FlightData refetch={refetchData} tripAttachments={tripAttachments} trip={trip} transportation={t} />
              )}
              {t.type === 'rental_car' && (
                <CarRentalData refetch={refetchData} tripAttachments={tripAttachments} trip={trip} rental={t} />
              )}
              {t.type === 'bus' && (
                <GenericTransportationData
                  refetch={refetchData}
                  tripAttachments={tripAttachments}
                  trip={trip}
                  transportation={t}
                />
              )}
              {t.type === 'boat' && (
                <GenericTransportationData
                  refetch={refetchData}
                  tripAttachments={tripAttachments}
                  trip={trip}
                  transportation={t}
                />
              )}
              {t.type === 'train' && (
                <GenericTransportationData
                  refetch={refetchData}
                  tripAttachments={tripAttachments}
                  trip={trip}
                  transportation={t}
                />
              )}
              {t.type === 'car' && (
                <GenericTransportationData
                  refetch={refetchData}
                  tripAttachments={tripAttachments}
                  trip={trip}
                  transportation={t}
                />
              )}
            </Fragment>
          );
        })}
      </Stack>

      <Stack mt={'sm'}>
        <Title order={5}>{t('transportation_travel_rentals', 'Rentals')}</Title>
        {rentalAgreements.length === 0 && (
          <Card withBorder>
            <Text c={'dimmed'}>{t('transportation_no_rentals', 'No Rentals')}</Text>
          </Card>
        )}
        {rentalAgreements.map((t: Transportation) => {
          return (
            <Fragment key={t.id}>
              <CarRentalData refetch={refetchData} trip={trip} rental={t} tripAttachments={tripAttachments} />
            </Fragment>
          );
        })}
      </Stack>
    </Container>
  );
};
