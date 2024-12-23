import { Transportation, Trip } from '../../../types/trips.ts';
import { Box, Divider, Grid, Modal, rem, Text, Title, Tooltip } from '@mantine/core';
import { IconArticle } from '@tabler/icons-react';
import { deleteTransportation, deleteTransportationAttachment } from '../../../lib';
import { formatDate, formatTime } from '../common/util.ts';
import { useTranslation } from 'react-i18next';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { CarRentalForm } from './CarRentalForm.tsx';

export const CarRentalData = ({
  trip,
  rental,
  refetch,
}: {
  trip: Trip;
  rental: Transportation;
  refetch: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <DataLine
      onEdit={() => {
        open();
      }}
      onDelete={() => {
        deleteTransportation(rental.id).then(() => {
          refetch();
        });
      }}
    >
      <Modal
        opened={opened}
        size="auto"
        fullScreen={isMobile}
        title={t('transportation.edit_rental_car', 'Edit Rental Car')}
        onClose={() => {
          close();
        }}
      >
        <CarRentalForm
          carRental={rental}
          trip={trip}
          onSuccess={() => {
            refetch();
            close();
          }}
          onCancel={() => {
            close();
          }}
        />
      </Modal>

      <Grid align={'top'} p={'xs'} grow={false}>
        <Grid.Col span={{ base: 12, sm: 1, md: 1, lg: 1 }} p={'md'}>
          <Box component="div" visibleFrom={'md'}>
            <Tooltip label={t(`transportation_type_${rental.type}`, rental.type)}>
              <IconArticle size={'sm'} stroke={0.5} style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(50),
                height: rem(50)
              }}/>
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'sm'}>
            <Title size={'lg'}>{t(`transportation_type_${rental.type}`, rental.type)}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation.pickup', 'Pickup')}
          </Text>
          <Text size="sm">{rental.origin}</Text>
          <Text size="sm">
            {`${formatDate(i18n.language, rental.departureTime)} ${formatTime(rental.departureTime)}`}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation.drop_off', 'Drop Off')}
          </Text>
          <Text size="sm">{rental.destination}</Text>
          <Text size="sm">{`${formatDate(i18n.language, rental.arrivalTime)} ${formatTime(rental.arrivalTime)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation.provider', 'Provider')}
          </Text>
          <Text size="md">{rental.metadata.rentalCompany}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation.reservation', 'Reservation')}
          </Text>
          <Text size="md">{rental.metadata.confirmationCode || 'Unknown'}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Text size="md">{rental.cost.value ? `${rental.cost.value} ${rental.cost.currency || ''}` : 'Unknown'}</Text>
        </Grid.Col>
      </Grid>
      <Attachments
        entity={rental}
        refetch={refetch}
        onDelete={(attachmentName) => deleteTransportationAttachment(rental.id, attachmentName)}
      />
    </DataLine>
  );
};
