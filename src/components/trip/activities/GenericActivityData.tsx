import { Box, Grid, Modal, rem, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { IconActivity } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { GenericActivityForm } from './GenericActivityForm.tsx';
import { deleteActivity, deleteActivityAttachments } from '../../../lib/api';
import { showDeleteNotification } from '../../../lib/notifications.tsx';
import { formatDate, formatTime } from '../../../lib/time.ts';
import { Attachments } from '../attachments/Attachments.tsx';
import { DataLine } from '../DataLine.tsx';

import type { Activity, Attachment, Trip } from '../../../types/trips.ts';

export const GenericActivityData = ({
  trip,
  activity,
  refetch,
  tripAttachments,
}: {
  trip: Trip;
  activity: Activity;
  refetch: () => void;
  tripAttachments?: Attachment[];
}) => {
  const { t } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 50em)');

  const attachments = tripAttachments?.filter((attachment) => {
    return activity.attachmentReferences?.includes(attachment.id);
  });

  return (
    <DataLine
      onEdit={() => {
        openForm();
      }}
      onDelete={() => {
        openConfirmModal({
          title: t('delete_activity', 'Delete Activity'),
          confirmProps: { color: 'red' },
          children: <Text size="sm">{t('deletion_confirmation', 'This action cannot be undone.')}</Text>,
          labels: {
            confirm: t('delete', 'Delete'),
            cancel: t('cancel', 'Cancel'),
          },
          onCancel: () => {},
          onConfirm: () => {
            deleteActivity(activity.id).then(() => {
              showDeleteNotification({
                title: t('activity_label', 'Activity'),
                message: t('activity_deleted', 'Activity {{name}} has been deleted', { name: activity.name }),
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
        title={t('activity_edit', 'Edit Activity')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericActivityForm
          activity={activity}
          trip={trip}
          exitingAttachments={attachments}
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
            <IconActivity
              size={'xs'}
              stroke={0.5}
              style={{
                color: 'var(--mantine-primary-color-6)',
                width: rem(50),
                height: rem(50),
              }}
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_name', 'Name')}
          </Text>
          <Text size="md">{activity.name}</Text>
          <Text size="sm" c={'dimmed'} lineClamp={1}>
            {activity.description}
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 1.5 }}>
          <Text size="xs" c={'dimmed'}>
            {t('activity_start_date', 'Start Date')}
          </Text>
          <Text size="md">{formatDate('', activity.startDate)}</Text>
          <Text size="md">{formatTime(activity.startDate)}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('activity_end_date', 'End Date')}
          </Text>
          {activity.endDate && (
            <>
              <Text size="md">{formatDate('', activity.endDate)}</Text>
              <Text size="md">{formatTime(activity.endDate)}</Text>
            </>
          )}
          {!activity.endDate && <Text size="md">{t('end_date_not_set', 'Not Set')}</Text>}
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 3 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging_address', 'Address')}
          </Text>
          <Text size="md">{activity.address}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('cost', 'Cost')}
          </Text>
          <Text size="md">{activity.cost?.value ? `${activity.cost.value} ${activity.cost.currency || ''}` : ''}</Text>
        </Grid.Col>
      </Grid>
      {attachments && (
        <Attachments
          attachments={attachments}
          onDelete={(attachmentId) => {
            return deleteActivityAttachments(activity.id, attachmentId).then(() => refetch());
          }}
        />
      )}
    </DataLine>
  );
};
