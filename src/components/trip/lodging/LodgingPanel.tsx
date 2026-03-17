import { Card, Container, Flex, LoadingOverlay, Modal, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddLodgingMenu } from './AddLodgingMenu.tsx';
import { GenericLodgingData } from './GenericLodgingData.tsx';
import { GenericLodgingForm } from './GenericLodgingForm.tsx';
import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { listLodgings } from '../../../lib/api';

import type { Attachment, Expense, Lodging, TravellerProfile, Trip } from '../../../types/trips.ts';

export const LodgingPanel = ({
  trip,
  tripAttachments,
  expenseMap,
  tripTravellers = [],
  refetchTrip,
}: {
  trip: Trip;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
  tripTravellers?: TravellerProfile[];
  refetchTrip: () => void;
}) => {
  const { t } = useTranslation();
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<Lodging[]>({
    queryKey: ['listLodgings', tripId],
    queryFn: () => listLodgings(tripId || ''),
  });

  const { isMobile } = useSurmaiContext();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [newLodgingType, setNewLodgingType] = useState<string>('hotel');

  const refetchData = () => {
    return refetch().then(() => refetchTrip());
  };

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  if (isError) {
    throw new Error(error.message);
  }

  return (
    <Container py={'xs'} size="xl">
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="xl"
        title={t('lodging_add_' + newLodgingType, 'Add Lodging')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericLodgingForm
          type={newLodgingType}
          trip={trip}
          expenseMap={expenseMap}
          tripTravellers={tripTravellers}
          onSuccess={() => {
            refetchData();
            closeForm();
          }}
          onCancel={() => {
            closeForm();
          }}
        />
      </Modal>

      {trip.canUpdate && (
        <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
          <AddLodgingMenu
            onClick={(type) => {
              setNewLodgingType(type);
              openForm();
            }}
          />
        </Flex>
      )}
      <Stack mt={'sm'}>
        <Title order={5}>{t('lodging_section_name', 'Lodging')}</Title>
        {!data ||
          (data.length === 0 && (
            <Card withBorder>
              <Text c={'dimmed'}>{t('lodging_no_data', 'No Lodgings')}</Text>
            </Card>
          ))}
        {data.map((t: Lodging) => {
          return (
            <Fragment key={t.id}>
              <GenericLodgingData
                refetch={refetchData}
                trip={trip}
                lodging={t}
                tripAttachments={tripAttachments}
                expenseMap={expenseMap}
                tripTravellers={tripTravellers}
              />
            </Fragment>
          );
        })}
      </Stack>
    </Container>
  );
};
