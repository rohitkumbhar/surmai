import { Box, Divider, Grid, Modal, rem, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArticle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { deleteTransportation, deleteTransportationAttachment } from '../../../lib/api';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';
import { CarRentalForm } from './CarRentalForm.tsx';
import { formatDate, formatTime } from '../../../lib/time.ts';

import type { Attachment, Expense, Transportation, Trip } from '../../../types/trips.ts';

export const CarRentalData = ({
  trip,
  rental,
  refetch,
  tripAttachments,
  expenseMap,
}: {
  trip: Trip;
  rental: Transportation;
  refetch: () => void;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
}) => {
  const { t, i18n } = useTranslation();
  const { isMobile } = useSurmaiContext();
  const [opened, { open, close }] = useDisclosure(false);
  const transportationAttachments = tripAttachments?.filter((attachment) =>
    rental.attachmentReferences?.includes(attachment.id)
  );

  // Get expense from map, handle null/undefined cases
  const expense = rental.expenseId ? expenseMap.get(rental.expenseId) : undefined;
  const costValue = expense?.cost?.value;
  const costCurrency = expense?.cost?.currency;

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
        title={t('transportation_edit_rental_car', 'Edit Rental Car')}
        onClose={() => {
          close();
        }}
      >
        <CarRentalForm
          carRental={rental}
          trip={trip}
          exitingAttachments={transportationAttachments}
          expenseMap={expenseMap}
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
            <Tooltip label={t(`transportation_car_rental`, 'Car Rental')}>
              <IconArticle
                size={'sm'}
                stroke={0.5}
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(50),
                  height: rem(50),
                }}
              />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'sm'}>
            <Title size={'lg'}>{t(`transportation_car_rental`, 'Car Rental')}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_pickup', 'Pickup')}
          </Text>
          <Text size="sm">{rental.origin}</Text>
          <Text size="sm">
            {`${formatDate(i18n.language, rental.departureTime)} ${formatTime(rental.departureTime)}`}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_drop_off', 'Drop Off')}
          </Text>
          <Text size="sm">{rental.destination}</Text>
          <Text size="sm">{`${formatDate(i18n.language, rental.arrivalTime)} ${formatTime(rental.arrivalTime)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_provider', 'Provider')}
          </Text>
          <Text size="md">{rental.metadata.rentalCompany}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_reservation', 'Reservation')}
          </Text>
          <Text size="md">{rental.metadata.confirmationCode || t('unknown', 'Unknown')}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Text size="md">{costValue ? `${costValue} ${costCurrency || ''}` : ''}</Text>
        </Grid.Col>
      </Grid>
      {transportationAttachments && (
        <Attachments
          attachments={transportationAttachments}
          onDelete={(attachmentName) => deleteTransportationAttachment(rental.id, attachmentName).then(() => refetch())}
        />
      )}
    </DataLine>
  );
};
