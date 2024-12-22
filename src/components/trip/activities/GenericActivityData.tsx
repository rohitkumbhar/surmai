import { Activity, Trip } from '../../../types/trips.ts';
import { Grid, Modal, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DataLine } from '../DataLine.tsx';
import { openConfirmModal } from '@mantine/modals';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Attachments } from '../attachments/Attachments.tsx';
import { deleteActivity, formatDate } from '../../../lib';
import { formatTime } from '../common/util.ts';
import { GenericActivityForm } from './GenericActivityForm.tsx';
import { notifications } from '@mantine/notifications';

export const GenericActivityData = ({
  trip,
  activity,
  refetch,
}: {
  trip: Trip;
  activity: Activity;
  refetch: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 50em)');

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
          onCancel: () => console.log('Cancel'),
          onConfirm: () => {
            deleteActivity(activity.id).then(() => {
              notifications.show({
                title: 'Deleted',
                message: `Activity ${activity.name} has been deleted`,
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
        title={t('activity.edit', 'Edit Activity')}
        onClose={() => {
          closeForm();
        }}
      >
        <GenericActivityForm
          activity={activity}
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
        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 2 }}>
          <Text size="xs" c={'dimmed'}>
            {t('activity.start_date', 'Date/Time')}
          </Text>
          <Text size="sm">{`${formatDate(i18n.language, activity.startDate)} ${formatTime(activity.startDate)}`}</Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3, lg: 4 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging.name', 'Name')}
          </Text>
          <Text size="md">{activity.name}</Text>
          <Text size="sm" c={'dimmed'}>
            {activity.description}
          </Text>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 2, lg: 3 }}>
          <Text size="xs" c={'dimmed'}>
            {t('lodging.address', 'Address')}
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
      <Attachments
        entity={activity}
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
