import { Attachment, Lodging, Trip } from '../../../types/trips.ts';
import { Anchor, Box, Divider, Grid, Modal, rem, Text, Title, Tooltip } from '@mantine/core';
import { IconCar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataLine } from '../DataLine.tsx';
import { openConfirmModal } from '@mantine/modals';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Attachments } from '../attachments/Attachments.tsx';
import { deleteLodging, deleteLodgingAttachments } from '../../../lib/api';
import { GenericLodgingForm } from './GenericLodgingForm.tsx';
import { typeIcons } from './typeIcons.ts';
import { formatDate, formatTime } from '../../../lib/time.ts';
import { showDeleteNotification } from '../../../lib/notifications.tsx';
import { getMapsLink } from '../../../lib/places.ts';
import { useCurrentUser } from '../../../auth/useCurrentUser.ts';

export const GenericLodgingData = ({
  trip,
  lodging,
  refetch,
  tripAttachments,
}: {
  trip: Trip;
  lodging: Lodging;
  refetch: () => void;
  tripAttachments?: Attachment[];
}) => {
  const { t, i18n } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 50em)');
  // @ts-expect-error Icon type
  const TypeIcon = typeIcons[lodging.type] || IconCar;
  const { user } = useCurrentUser();

  const attachments = tripAttachments?.filter((attachment) => {
    return lodging.attachmentReferences?.includes(attachment.id);
  });

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
          onCancel: () => {},
          onConfirm: () => {
            deleteLodging(lodging.id).then(() => {
              showDeleteNotification({
                title: t('lodging_section_name', 'Lodging'),
                message: t('lodging_deleted', 'Lodging at {{name}} has been deleted', { name: lodging.name }),
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
        title={t('lodging_edit_' + lodging.type, 'Edit Lodging')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericLodgingForm
          type={lodging.type}
          lodging={lodging}
          exitingAttachments={attachments}
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
            <Tooltip label={t(`lodging_${lodging.type}`, lodging.type)}>
              <TypeIcon
                size={'xs'}
                stroke={0.5}
                style={{
                  color: 'var(--mantine-primary-color-6)',
                  width: rem(50),
                  height: rem(50),
                }}
              />
            </Tooltip>
          </Box>
          <Box component="div" hiddenFrom={'md'}>
            <Title size={'lg'}>{t(`lodging_${lodging.type}`, lodging.type)}</Title>
            <Divider mt={'5px'} />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_check_in', 'Check-In')}
          </Text>
          <Text size="md">{`${formatDate(i18n.language, lodging.startDate)}`}</Text>
          <Text size="md">{`${formatTime(lodging.startDate)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_check_out', 'Check-Out')}
          </Text>
          <Text size="md">{`${formatDate(i18n.language, lodging.endDate)}`}</Text>
          <Text size="md">{`${formatTime(lodging.endDate)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_name', 'Name')}
          </Text>
          <Text size="md">{lodging.name}</Text>
          <Text size="xs">{lodging.metadata?.place.name}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_address', 'Address')}
          </Text>

          {lodging.address && (
            <Anchor href={getMapsLink(user, lodging.address)} target={'_blank'} c={'var(--mantine-primary-color-6)">'}>
              <Text size="md">{lodging.address} </Text>
            </Anchor>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_confirmation_code', 'Confirmation Code')}
          </Text>
          <Text size="md">{lodging.confirmationCode || ''}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Text size="md">{lodging.cost?.value ? `${lodging.cost.value} ${lodging.cost.currency || ''}` : ''}</Text>
        </Grid.Col>
      </Grid>
      {attachments && (
        <Attachments
          attachments={attachments}
          onDelete={(attachmentId) => {
            return deleteLodgingAttachments(lodging.id, attachmentId).then(() => refetch());
          }}
        />
      )}
    </DataLine>
  );
};
