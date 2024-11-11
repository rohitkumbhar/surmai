import {Container, Flex, LoadingOverlay, Modal, Stack, Title} from '@mantine/core';
import {Transportation, Trip} from '../../../types/trips.ts';
import {AddTransportationMenu} from './AddTransportationMenu.tsx';
import {Fragment, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {listTransportations} from '../../../lib';
import {CarRentalData} from './CarRentalData.tsx';
import {GenericTransportationData} from './GenericTransportationData.tsx';
import {useTranslation} from 'react-i18next';
import {GenericTransportationModeForm} from "./GenericTransportationModeForm.tsx";
import {useDisclosure} from "@mantine/hooks";

export const TransportationPanel = ({trip}: { trip: Trip }) => {
  const {t} = useTranslation();
  const [opened, {open, close}] = useDisclosure(false);
  const [newTransportationType, setNewTransportationType] = useState<string>('flight')

  const tripId = trip.id;
  const {isPending, isError, data, error, refetch} = useQuery<
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
        overlayProps={{radius: 'sm', blur: 2}}
      />
    );
  }

  if (isError) {
    throw new Error(error.message);
  }

  return (
    <Container py={'xs'} size="lg">
      <Modal opened={opened} size="auto" title="Modal size auto" onClose={() => {
        close()
      }}>
        <GenericTransportationModeForm transportationType={newTransportationType}
                                       trip={trip} onSuccess={() => {
          refetch();
          close();
        }} onCancel={() => {
          close()
        }}/>
      </Modal>

      <Flex
        mih={50}
        gap="md"
        justify="flex-end"
        align="center"
        direction="row"
        wrap="wrap"
      >
        <AddTransportationMenu trip={trip} refetch={refetch} onClick={(type) => {
          setNewTransportationType(type);
          open();
        }}/>
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
                  <CarRentalData refetch={refetch} trip={trip} rental={t}/>
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
                <CarRentalData refetch={refetch} trip={trip} rental={t}/>
              </Fragment>
            );
          })}
      </Stack>
    </Container>
  );
};
