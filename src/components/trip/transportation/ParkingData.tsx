import { Box, Divider, Grid, Modal, rem, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconParking } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useSurmaiContext } from '../../../app/useSurmaiContext.ts';
import { deleteTransportation, deleteTransportationAttachment } from '../../../lib/api';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';
import { ParkingForm } from './ParkingForm.tsx';
import { formatDate, formatTime } from '../../../lib/time.ts';

import type { Attachment, Expense, Transportation, Trip } from '../../../types/trips.ts';

export const ParkingData = ({
  trip,
  parking,
  refetch,
  tripAttachments,
  expenseMap,
}: {
  trip: Trip;
  parking: Transportation;
  refetch: () => void;
  tripAttachments?: Attachment[];
  expenseMap: Map<string, Expense>;
}) => {
  const { t, i18n } = useTranslation();
  const { isMobile } = useSurmaiContext();
  const [opened, { open, close }] = useDisclosure(false);
  const transportationAttachments = tripAttachments?.filter((attachment) =>
    parking.attachmentReferences?.includes(attachment.id)
  );

  // Get expense from map, handle null/undefined cases
  const expense = parking.expenseId ? expenseMap.get(parking.expenseId) : undefined;
  const costValue = expense?.cost?.value;
  const costCurrency = expense?.cost?.currency;

  return (
    <DataLine
      link={parking.link}
      onEdit={() => {
        open();
      }}
      onDelete={() => {
        deleteTransportation(parking.id).then(() => {
          refetch();
        });
      }}
    >
      <Modal
        opened={opened}
        size="xl"
        fullScreen={isMobile}
        title={t('transportation_edit_parking', 'Edit Parking')}
        onClose={() => {
          close();
        }}
      >
        <ParkingForm
          parking={parking}
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
            <Tooltip label={t(`transportation_parking`, 'Parking')}>
              <IconParking
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
            <Title size={'lg'}>{t(`transportation_parking`, 'Parking')}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('parking_address', 'Address')}
          </Text>
          <Text size="sm">{parking.origin}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('parking_start_date', 'Start Date')}
          </Text>
          <Text size="sm">
            {`${formatDate(i18n.language, parking.departureTime)} ${formatTime(parking.departureTime)}`}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('parking_end_date', 'End Date')}
          </Text>
          <Text size="sm">{`${formatDate(i18n.language, parking.arrivalTime)} ${formatTime(parking.arrivalTime)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('transportation_provider', 'Provider')}
          </Text>
          <Text size="md">{parking.metadata.provider || t('unknown', 'Unknown')}</Text>
        </Grid.Col>

        {parking.metadata.spotNumber && (
          <Grid.Col span={{ base: 12, sm: 6, md: 1, lg: 1 }}>
            <Text size="xs" c={'dimmed'}>
              {t('parking_spot_number', 'Spot Number')}
            </Text>
            <Text size="md">{parking.metadata.spotNumber}</Text>
          </Grid.Col>
        )}

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
          onDelete={(attachmentName) =>
            deleteTransportationAttachment(parking.id, attachmentName).then(() => refetch())
          }
        />
      )}
    </DataLine>
  );
};
