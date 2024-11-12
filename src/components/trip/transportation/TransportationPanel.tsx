import {
  Container,
  Flex,
  LoadingOverlay,
  Modal,
  Stack,
  Title,
} from '@mantine/core';
import { Transportation, Trip } from '../../../types/trips.ts';
import { AddTransportationMenu } from './AddTransportationMenu.tsx';
import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTransportations } from '../../../lib';
import { CarRentalData } from './CarRentalData.tsx';
import { GenericTransportationData } from './GenericTransportationData.tsx';
import { useTranslation } from 'react-i18next';
import { GenericTransportationModeForm } from './GenericTransportationModeForm.tsx';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { CarRentalForm } from './CarRentalForm.tsx';

export const TransportationPanel = ({ trip }: { trip: Trip }) => {
  const { t } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [
    carRentalFormOpened,
    { open: openRentalForm, close: closeRentalForm },
  ] = useDisclosure(false);
  const [newTransportationType, setNewTransportationType] =
    useState<string>('flight');
  const isMobile = useMediaQuery('(max-width: 50em)');
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<
    Transportation[]
  >({
    queryKey: ['listTransportations', tripId],
    queryFn: () => listTransportations(tripId || ''),
  });

  if (isPending) {
    return (
      <LoadingOverlay
        visible={true}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
    );
  }

  if (isError) {
    throw new Error(error.message);
  }

  return (
    <Container py={'xs'} size="lg">
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="auto"
        title={t(
          'transportation.add_' + newTransportationType,
          'Add Transportation'
        )}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericTransportationModeForm
          transportationType={newTransportationType}
          trip={trip}
          onSuccess={() => {
            refetch();
            closeForm();
          }}
          onCancel={() => {
            closeForm();
          }}
        />
      </Modal>

      <Modal
        opened={carRentalFormOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('transportation.add_rental_car', 'Add Rental Car')}
        onClose={() => {
          closeRentalForm();
        }}
      >
        <CarRentalForm
          trip={trip}
          onSuccess={() => {
            refetch();
            closeRentalForm();
          }}
          onCancel={() => {
            closeRentalForm();
          }}
        />
      </Modal>

      <Flex
        mih={50}
        gap="md"
        justify="flex-end"
        align="center"
        direction="row"
        wrap="wrap"
      >
        <AddTransportationMenu
          onClick={(type) => {
            if (type === 'car_rental') {
              openRentalForm();
            } else {
              setNewTransportationType(type);
              openForm();
            }
          }}
        />
      </Flex>
      <Stack mt={'sm'}>
        <Title order={5}>
          {t('transportation.travel_timeline', 'Travel Timeline')}
        </Title>
        {data
          .filter((t) => t.type !== 'rental_car')
          .map((t: Transportation) => {
            return (
              <Fragment key={t.id}>
                {t.type === 'flight' && (
                  <GenericTransportationData
                    refetch={refetch}
                    trip={trip}
                    transportation={t}
                  />
                )}
                {t.type === 'rental_car' && (
                  <CarRentalData refetch={refetch} trip={trip} rental={t} />
                )}
                {t.type === 'bus' && (
                  <GenericTransportationData
                    refetch={refetch}
                    trip={trip}
                    transportation={t}
                  />
                )}
                {t.type === 'boat' && (
                  <GenericTransportationData
                    refetch={refetch}
                    trip={trip}
                    transportation={t}
                  />
                )}
                {t.type === 'train' && (
                  <GenericTransportationData
                    refetch={refetch}
                    trip={trip}
                    transportation={t}
                  />
                )}
                {t.type === 'car' && (
                  <GenericTransportationData
                    refetch={refetch}
                    trip={trip}
                    transportation={t}
                  />
                )}
              </Fragment>
            );
          })}
      </Stack>

      <Stack mt={'sm'}>
        <Title order={5}>{t('transportation.travel_rentals', 'Rentals')}</Title>
        {data
          .filter((t) => t.type === 'rental_car')
          .map((t: Transportation) => {
            return (
              <Fragment key={t.id}>
                <CarRentalData refetch={refetch} trip={trip} rental={t} />
              </Fragment>
            );
          })}
      </Stack>
    </Container>
  );
};
