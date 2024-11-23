import { Lodging, LodgingType, Trip } from '../../../types/trips.ts';
import { Box, Divider, Grid, Modal, Text, Title, Tooltip } from '@mantine/core';
import { IconBedFlat, IconBuildingEstate, IconCar, IconHome, IconTent } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataLine } from '../DataLine.tsx';
import { openConfirmModal } from '@mantine/modals';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Attachments } from '../attachments/Attachments.tsx';
import { deleteLodging, formatDate } from '../../../lib';
import { formatTime } from '../common/util.ts';
import { notifications } from '@mantine/notifications';
import { GenericLodgingForm } from './GenericLodgingForm.tsx';

const typeIcons = {
  [LodgingType.HOTEL]: IconBuildingEstate,
  [LodgingType.HOME]: IconHome,
  [LodgingType.RENTAL]: IconBedFlat,
  [LodgingType.CAMP_SITE]: IconTent,
};

export const GenericLodgingData = ({
  trip,
  lodging,
  refetch,
}: {
  trip: Trip;
  lodging: Lodging;
  refetch: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 50em)');
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[lodging.type] || IconCar;

  return (
    <DataLine
      onEdit={() => {
        openForm();
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_lodging', 'Delete Lodging'),
          confirmProps: { color: 'red' },
          children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
          labels: {
            confirm: t('delete', 'Delete'),
            cancel: t('cancel', 'Cancel'),
          },
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteLodging(lodging.id).then(() => {
              notifications.show({
                title: 'Deleted',
                message: `Lodging at ${lodging.name} has been deleted`,
                position: 'top-right',
              });
              refetch();
            });
          },
        });
      }}
    >
      <Modal
        opened={formOpened}
        fullScreen={isMobile}
        size="auto"
        title={t('lodging.edit_' + lodging.type, 'Edit Lodging')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericLodgingForm
          type={lodging.type}
          lodging={lodging}
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
      <Grid align={'top'} p={'xs'} grow={false}>
        <Grid.Col span={{ base: 12, sm: 12, md: 1, lg: 1 }} p={'md'}>
          <Box component="div" visibleFrom={'md'}>
            <Tooltip label={t(`lodging.${lodging.type}`, lodging.type)}>
              <TypeIcon size={'sm'} stroke={1} />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'md'}>
            <Title size={'lg'}>{t(`lodging.${lodging.type}`, lodging.type)}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('lodging.check_in', 'Check-In')}
          </Text>
          <Text size="md">{`${formatDate(i18n.language, lodging.startDate)}`}</Text>
          <Text size="md">{`${formatTime(i18n.language, lodging.startDate)}`}</Text>
        </Grid.Col>

        {/*<Grid.Col span={{ base: 12, sm: 2, md: 1, lg: 1 }}>
          <Center h={'100%'}>
            <Text c={'dimmed'} size={'xs'}>
              {getNumberOfDays(lodging.startDate, lodging.endDate)}
            </Text>
          </Center>
        </Grid.Col>
*/}
        <Grid.Col span={{ base: 12, sm: 5, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('lodging.check_out', 'Check-Out')}
          </Text>
          <Text size="md">{`${formatDate(i18n.language, lodging.endDate)}`}</Text>
          <Text size="md">{`${formatTime(i18n.language, lodging.endDate)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Title size="xs" c={'dimmed'}>
            {t('lodging.name', 'Name')}
          </Title>
          <Text size="md">{lodging.name}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Title size="xs" c={'dimmed'}>
            {t('lodging.address', 'Address')}
          </Title>
          <Text size="md">{lodging.address}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Text size="sm" c={'dimmed'}>
            {t('lodging.confirmation_code', 'Confirmation Code')}
          </Text>
          <Title size="md">{lodging.confirmationCode || 'Unknown'}</Title>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="sm" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Title size="md">
            {lodging.cost?.value ? `${lodging.cost.value} ${lodging.cost.currency || ''}` : 'Unknown'}
          </Title>
        </Grid.Col>
      </Grid>
      <Attachments
        entity={lodging}
        refetch={refetch}
        onDelete={() => {
          return new Promise<unknown>(() => {
            return true;
          });
        }}
      />
    </DataLine>
  );
};
