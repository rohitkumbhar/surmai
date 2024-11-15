import { Lodging, Trip } from '../../../types/trips.ts';
import { useQuery } from '@tanstack/react-query';
import { listLodgings } from '../../../lib';
import { Container, Flex, LoadingOverlay, Modal, Stack, Title } from '@mantine/core';
import { AddLodgingMenu } from './AddLodgingMenu.tsx';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericLodgingData } from './GenericLodgingData.tsx';
import { GenericLodgingForm } from './GenericLodgingForm.tsx';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

export const LodgingPanel = ({ trip }: { trip: Trip }) => {
  const { t } = useTranslation();
  const tripId = trip.id;
  const { isPending, isError, data, error, refetch } = useQuery<Lodging[]>({
    queryKey: ['listLodgings', tripId],
    queryFn: () => listLodgings(tripId || ''),
  });

  const isMobile = useMediaQuery('(max-width: 50em)');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [newLodgingType, setNewLodgingType] = useState<string>('hotel');

  if (isPending) {
    return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;
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
        title={t('lodging.add_' + newLodgingType, 'Add Lodging')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericLodgingForm
          type={newLodgingType}
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

      <Flex mih={50} gap="md" justify="flex-end" align="center" direction="row" wrap="wrap">
        <AddLodgingMenu
          onClick={(type) => {
            setNewLodgingType(type);
            openForm();
          }}
        />
      </Flex>
      {
        <Stack mt={'sm'}>
          <Title order={5}>{t('lodging.name', 'Lodging')}</Title>
          {data.map((t: Lodging) => {
            return (
              <Fragment key={t.id}>
                <GenericLodgingData refetch={refetch} trip={trip} lodging={t} />
              </Fragment>
            );
          })}
        </Stack>
      }
    </Container>
  );
};
