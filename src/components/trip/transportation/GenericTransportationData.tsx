import { Transportation, Trip } from '../../../types/trips.ts';
import { Box, Divider, Grid, Modal, Text, Title, Tooltip } from '@mantine/core';
import { IconBus, IconCar, IconPlaneInflight, IconShip, IconTrain } from '@tabler/icons-react';
import { deleteTransportation, deleteTransportationAttachment } from '../../../lib';
import { formatDate, formatTime } from '../common/util.ts';
import { useTranslation } from 'react-i18next';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';
import { openConfirmModal } from '@mantine/modals';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { GenericTransportationModeForm } from './GenericTransportationModeForm.tsx';

const typeIcons = {
  boat: IconShip,
  bus: IconBus,
  flight: IconPlaneInflight,
  train: IconTrain,
  car: IconCar,
};

export const GenericTransportationData = ({
  trip,
  transportation,
  refetch,
}: {
  trip: Trip;
  transportation: Transportation;
  refetch: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [opened, { open, close }] = useDisclosure(false);
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[transportation.type] || IconCar;

  return (
    <DataLine
      onEdit={() => {
        open();
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_transportation', 'Delete Transportation'),
          confirmProps: { color: 'red' },
          children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
          labels: {
            confirm: t('delete', 'Delete'),
            cancel: t('cancel', 'Cancel'),
          },
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteTransportation(transportation.id).then(() => {
              notifications.show({
                title: 'Deleted',
                message: `Transportation from ${transportation.origin} to ${transportation.destination} has been deleted`,
                position: 'top-right',
              });
              refetch();
            });
          },
        });
      }}
    >
      <Modal
        opened={opened}
        size="auto"
        fullScreen={isMobile}
        title={t('transportation.edit_' + transportation.type, 'Edit Transportation')}
        onClose={() => {
          close();
        }}
      >
        <GenericTransportationModeForm
          transportationType={transportation.type}
          transportation={transportation}
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
        <Grid.Col span={{ base: 12, sm: 12, md: 1, lg: 1 }} p={'md'}>
          <Box component="div" visibleFrom={'md'}>
            <Tooltip label={t(`transportation.${transportation.type}`, `transportation.${transportation.type}`)}>
              <TypeIcon size={'sm'} stroke={1} />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'md'}>
            <Title size={'lg'}>
              {t(`transportation.${transportation.type}`, `transportation.${transportation.type}`)}
            </Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2.5 }}>
          <Text size="sm" c={'dimmed'}>
            {t('transportation.from', 'From')}
          </Text>
          <Title size="md" fw={400}>
            {transportation.origin}
          </Title>
          <Text size="xs">{formatDate(i18n.language, transportation.departureTime)}</Text>
          <Text size="xs">{formatTime(transportation.departureTime)}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2.5 }}>
          <Text size="sm" c={'dimmed'}>
            {t('transportation.to', 'To')}
          </Text>
          <Title size="md" fw={400}>
            {transportation.destination}
          </Title>
          <Text size="xs">{formatDate(i18n.language, transportation.arrivalTime)}</Text>
          <Text size="xs">{formatTime(transportation.arrivalTime)}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('transportation.provider', 'Provider')}
          </Text>
          <Title size="md">{transportation.metadata.provider}</Title>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('transportation.reservation', 'Reservation')}
          </Text>
          <Title size="md">{transportation.metadata.reservation || 'Unknown'}</Title>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Title size="md">
            {transportation.cost.value
              ? `${transportation.cost.value} ${transportation.cost.currency || ''}`
              : 'Unknown'}
          </Title>
        </Grid.Col>
      </Grid>
      <Attachments
        entity={transportation}
        refetch={refetch}
        onDelete={(attachmentName) => deleteTransportationAttachment(transportation.id, attachmentName)}
      />
    </DataLine>
  );
};
